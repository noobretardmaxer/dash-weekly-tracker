import { randomBytes, createHash } from "crypto";

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

// Refresh/invite tokens are high-entropy random values (not user-chosen passwords), so a
// fast deterministic hash is the right tool here — it lets lookups match by hash without
// the per-user salt bcrypt needs to defend against low-entropy secrets.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
