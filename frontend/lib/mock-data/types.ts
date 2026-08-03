export type TimeSeriesPoint = {
  date: string; // ISO date, YYYY-MM-DD
  value: number;
};

export type MultiSeriesPoint = {
  date: string;
  [seriesKey: string]: string | number;
};

export type KpiFormat = "number" | "compact" | "percent" | "position" | "duration";

export type KpiMetric = {
  id: string;
  label: string;
  value: number;
  format: KpiFormat;
  deltaPct: number;
  positiveIsGood: boolean;
  series: TimeSeriesPoint[];
};

export type NamedSeries = {
  key: string;
  label: string;
  data: TimeSeriesPoint[];
};

export type ShareSlice = {
  name: string;
  value: number;
};

export type FunnelStep = {
  name: string;
  value: number;
};
