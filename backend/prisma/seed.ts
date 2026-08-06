import { PrismaClient } from "@prisma/client";
import { MASTER_SERIES_DAYS } from "../src/integrations/shared/fixtures/time-series";
import { createPostHogIntegration } from "../src/integrations/posthog";
import { createGscIntegration } from "../src/integrations/gsc";
import { createSemrushIntegration } from "../src/integrations/semrush";
import { createTwitterIntegration } from "../src/integrations/twitter";
import { createDiscordIntegration } from "../src/integrations/discord";
import { createRedditIntegration, DEFAULT_REDDIT_KEYWORDS } from "../src/integrations/reddit";
import { createBlogIntegration } from "../src/integrations/blog";
import { createSocialIntegration } from "../src/integrations/social";
import { DEFAULT_ALERT_THRESHOLDS } from "../src/services/alerts/rules";
import { generateExecutiveReport } from "../src/services/reports/generate-executive-report";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

// Dev-only fixed password for every seeded user — printed at the end of the seed run so a
// fresh `docker compose up` / `prisma db seed` always has usable login credentials without
// forcing a fresh clone through the invite-accept flow just to try the app out.
const DEV_PASSWORD = "password123";

const TEAM_MEMBERS = [
  { name: "Sayandeep Das", initials: "SD", role: "admin" as const },
  { name: "Priya Raman", initials: "PR", role: "member" as const },
  { name: "Jordan Kim", initials: "JK", role: "member" as const },
  { name: "Alex Chen", initials: "AC", role: "member" as const },
  { name: "Morgan Lee", initials: "ML", role: "member" as const },
  { name: "Fatima Qureshi", initials: "FQ", role: "member" as const },
];

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@hydradb.com`;
}

async function seedUsers(): Promise<void> {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  for (const member of TEAM_MEMBERS) {
    await prisma.user.upsert({
      where: { email: emailFor(member.name) },
      create: {
        email: emailFor(member.name),
        name: member.name,
        initials: member.initials,
        role: member.role,
        status: "active",
        passwordHash,
      },
      update: { name: member.name, initials: member.initials, role: member.role },
    });
  }
  console.log(`Seeded ${TEAM_MEMBERS.length} users`);
}

async function seedSettings(): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "reddit.keywords" },
    create: { key: "reddit.keywords", value: DEFAULT_REDDIT_KEYWORDS },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: "alerts.thresholds" },
    create: { key: "alerts.thresholds", value: DEFAULT_ALERT_THRESHOLDS },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: "workspace.name" },
    create: { key: "workspace.name", value: "HydraDB Growth" },
    update: {},
  });
  console.log("Seeded settings (reddit.keywords, alerts.thresholds, workspace.name)");
}

async function seedIntegration(name: string, createModule: () => { authenticate(): Promise<void>; fetch(range: { from: Date; to: Date }): Promise<unknown>; normalize(raw: unknown): Promise<unknown[]>; store(records: unknown[]): Promise<{ count: number }> }): Promise<void> {
  const integration = createModule();
  const range = { from: new Date(Date.now() - MASTER_SERIES_DAYS * 24 * 60 * 60 * 1000), to: new Date() };

  await integration.authenticate();
  const raw = await integration.fetch(range);
  const normalized = await integration.normalize(raw);
  const { count } = await integration.store(normalized);
  console.log(`Seeded ${name}: ${count} records`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the seed script with NODE_ENV=production");
  }

  await seedUsers();
  await seedSettings();

  await seedIntegration("posthog", createPostHogIntegration);
  await seedIntegration("gsc", createGscIntegration);
  await seedIntegration("semrush", createSemrushIntegration);
  await seedIntegration("twitter", createTwitterIntegration);
  await seedIntegration("discord", createDiscordIntegration);
  await seedIntegration("reddit", createRedditIntegration);
  // Blog + Social now run through the same integration seam as everything else
  // (fixture-backed modules), so dev and production populate them identically.
  await seedIntegration("blog", createBlogIntegration);
  await seedIntegration("social", createSocialIntegration);

  const report = await generateExecutiveReport();
  console.log(`Seeded initial executive report: ${report.id}`);

  console.log("\nLogin with any seeded user's email and this dev password:");
  console.log(`  password: ${DEV_PASSWORD}`);
  console.log(`  e.g. ${emailFor(TEAM_MEMBERS[0].name)} (admin), ${emailFor(TEAM_MEMBERS[1].name)} (member)`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
