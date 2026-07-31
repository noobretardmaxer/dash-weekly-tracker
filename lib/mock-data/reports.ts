import { faker } from "@faker-js/faker";

faker.seed(1011);

export type ReportStatus = "Ready" | "Generating" | "Failed";

export type ReportRow = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: ReportStatus;
};

const REPORT_TYPES = ["Weekly Executive Summary", "Monthly SEO Report", "Content Performance", "Social Growth Digest", "Search Console Export"];

export const reports: ReportRow[] = Array.from({ length: 14 }, (_, i) => {
  const type = faker.helpers.arrayElement(REPORT_TYPES);
  const createdAt = faker.date.recent({ days: 60 }).toISOString().slice(0, 10);
  return {
    id: `report-${i}`,
    name: `${type} — ${createdAt}`,
    type,
    createdAt,
    status: faker.helpers.weightedArrayElement([
      { value: "Ready" as const, weight: 8 },
      { value: "Generating" as const, weight: 1 },
      { value: "Failed" as const, weight: 1 },
    ]),
  };
}).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
