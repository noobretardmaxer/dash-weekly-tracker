import type { GscProperty } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { env } from "../../lib/env";
import { listSites } from "./api";

/**
 * The property registry. Search Console exposes the same site as up to two
 * properties (domain vs URL-prefix) with materially different numbers, so every
 * metric row is property-scoped and the UI switches between them. This module
 * mirrors `sites.list` into `gsc_properties` and resolves the default.
 */

const DOMAIN_PREFIX = "sc-domain:";

export function propertyType(siteUrl: string): "domain" | "url_prefix" {
  return siteUrl.startsWith(DOMAIN_PREFIX) ? "domain" : "url_prefix";
}

export function propertyDisplayName(siteUrl: string): string {
  return siteUrl.startsWith(DOMAIN_PREFIX) ? siteUrl.slice(DOMAIN_PREFIX.length) : siteUrl;
}

/**
 * Upsert every property the service account can see into `gsc_properties`.
 * The default property is env.GSC_SITE_URL if it matches one, else the domain
 * property (fuller picture), else the first. Exactly one row ends up default.
 */
export async function syncProperties(): Promise<GscProperty[]> {
  const sites = await listSites();

  for (const site of sites) {
    await prisma.gscProperty.upsert({
      where: { siteUrl: site.siteUrl },
      create: {
        siteUrl: site.siteUrl,
        type: propertyType(site.siteUrl),
        displayName: propertyDisplayName(site.siteUrl),
        permissionLevel: site.permissionLevel,
        isDefault: false,
      },
      update: {
        type: propertyType(site.siteUrl),
        displayName: propertyDisplayName(site.siteUrl),
        permissionLevel: site.permissionLevel,
      },
    });
  }

  await ensureExactlyOneDefault();
  return prisma.gscProperty.findMany({ orderBy: { siteUrl: "asc" } });
}

async function ensureExactlyOneDefault(): Promise<void> {
  const all = await prisma.gscProperty.findMany({ orderBy: { siteUrl: "asc" } });
  if (all.length === 0) return;

  const preferred =
    all.find((p) => env.GSC_SITE_URL && p.siteUrl === env.GSC_SITE_URL) ??
    all.find((p) => p.type === "domain") ??
    all[0];

  const alreadyCorrect = all.filter((p) => p.isDefault).length === 1 && all.find((p) => p.isDefault)?.id === preferred.id;
  if (alreadyCorrect) return;

  await prisma.$transaction([
    prisma.gscProperty.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
    prisma.gscProperty.update({ where: { id: preferred.id }, data: { isDefault: true } }),
  ]);
}

export async function getStoredProperties(): Promise<GscProperty[]> {
  return prisma.gscProperty.findMany({ orderBy: { siteUrl: "asc" } });
}

export async function getDefaultProperty(): Promise<GscProperty | null> {
  return (await prisma.gscProperty.findFirst({ where: { isDefault: true } })) ?? prisma.gscProperty.findFirst();
}
