const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullNumberFormatter = new Intl.NumberFormat("en-US");

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatNumber(value: number): string {
  return fullNumberFormatter.format(Math.round(value));
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function truncateLabel(value: string, maxLength = 22): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
