import assert from "node:assert/strict";
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { normalizePrivateKey, stripWrappingQuotes } from "./auth";
import { classifyGscError } from "./errors";

/**
 * These tests pin the exact bug that took the team days: a PKCS#8 private key
 * pasted straight out of the service-account JSON — surrounded by double quotes
 * and with literal `\n` escapes — then shell-wrapped in single quotes, so the
 * value that reaches process.env is `"-----BEGIN PRIVATE KEY-----\n...\n"`.
 * The old code only did `.replace(/\\n/g, "\n")`, leaving the leading quote, so
 * OpenSSL threw `DECODER routines::unsupported`.
 */

// A real PKCS#8 PEM, generated fresh so the test is self-contained.
const REAL_PEM = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
}).privateKey as string;

test("normalizePrivateKey recovers a key mangled exactly like prod (quotes + escaped \\n)", () => {
  // Simulate the prod value: JSON-escape (adds surrounding " and literal \n),
  // then the env-file single-quote layer is already stripped by the parser.
  const prodValue = JSON.stringify(REAL_PEM); // -> "-----BEGIN...\n...\n-----END PRIVATE KEY-----\n"
  assert.ok(prodValue.startsWith('"') && prodValue.includes("\\n"), "fixture should be quoted with escaped newlines");

  const cleaned = normalizePrivateKey(prodValue);

  assert.ok(cleaned.startsWith("-----BEGIN PRIVATE KEY-----"), "leading quote must be stripped");
  assert.ok(!cleaned.includes("\\n"), "escaped newlines must be restored to real newlines");
  // The definitive check: OpenSSL must now parse it without throwing.
  assert.doesNotThrow(() => createPrivateKey(cleaned));
});

test("normalizePrivateKey is a no-op on an already-clean multi-line PEM", () => {
  const cleaned = normalizePrivateKey(REAL_PEM);
  assert.doesNotThrow(() => createPrivateKey(cleaned));
});

test("stripWrappingQuotes handles nested single-around-double quotes", () => {
  assert.equal(stripWrappingQuotes(`'"hello"'`), "hello");
  assert.equal(stripWrappingQuotes(`"hello"`), "hello");
  assert.equal(stripWrappingQuotes(`hello`), "hello");
});

test("classifyGscError maps the OpenSSL DECODER error to AUTH_INVALID_KEY", () => {
  // What an API-key-shaped value produces when handed to createPrivateKey.
  let raw: unknown;
  try {
    createPrivateKey("not-a-real-key-40charhash0000000000000000");
  } catch (e) {
    raw = e;
  }
  const info = classifyGscError(raw);
  assert.equal(info.code, "AUTH_INVALID_KEY");
  assert.match(info.remedy, /GOOGLE_SERVICE_ACCOUNT_B64/);
});

test("classifyGscError maps a 403 body to AUTH_NO_PERMISSION", () => {
  const info = classifyGscError({
    response: { status: 403, data: { error: { message: "User does not have sufficient permission for site" } } },
  });
  assert.equal(info.code, "AUTH_NO_PERMISSION");
});

test("classifyGscError maps a 429 to a retryable QUOTA_EXCEEDED", () => {
  const info = classifyGscError({ response: { status: 429, data: { error: { message: "RESOURCE_EXHAUSTED" } } } });
  assert.equal(info.code, "QUOTA_EXCEEDED");
  assert.equal(info.retryable, true);
});
