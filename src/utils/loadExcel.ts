import * as XLSX from "xlsx";

export type ColumnType =
  | "date"
  | "numeric"
  | "categorical"
  | "text"
  | "mixed"
  | "empty"
  | "unknown";

export type ColumnMeta = {
  name: string;
  normalizedName: string;
  type: ColumnType;
};

export type SheetMeta = {
  name: string;
  platform: "facebook" | "instagram" | "youtube" | "unknown";
  kind:
    | "platform_main"
    | "post_level"
    | "monthly_summary"
    | "other";
  rowCount: number;
  columns: ColumnMeta[];
};

export type SheetData = {
  name: string;
  rows: Record<string, unknown>[];
  meta: SheetMeta;
};

export type WorkbookData = {
  sheets: SheetData[];
};

export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "scatter"
  | "table"
  | "kpi";

export type ChartFieldRole = "x" | "y" | "series" | "value";

export type ChartField = {
  role: ChartFieldRole;
  column: string;
};

export type SectionId =
  | "overview"
  | "reach"
  | "views"
  | "impressions"
  | "engagement";

export type ChartConfig = {
  id: string;
  section: SectionId;
  title: string;
  type: ChartType;
  fields: ChartField[];
  platforms?: string[];
};

export type SectionModel = {
  id: SectionId;
  title: string;
  charts: ChartConfig[];
};

export type DashboardModel = {
  sheets: SheetData[];
  sections: SectionModel[];
};

function detectColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  const sample = nonNull.slice(0, 200);

  if (!nonNull.length) return "empty";

  const allDates = sample.every((v) => v instanceof Date);
  if (allDates) return "date";

  const allNums = sample.every((v) => typeof v === "number");
  if (allNums) return "numeric";

  const allStrings = sample.every((v) => typeof v === "string");
  if (allStrings) {
    const unique = new Set(sample as string[]);
    const ratio = unique.size / sample.length;
    if (ratio < 0.6 && unique.size <= 50) {
      return "categorical";
    }
    return "text";
  }

  return "mixed";
}

function buildSheetMeta(name: string, rows: Record<string, unknown>[]): SheetMeta {
  const rowCount = rows.length;
  const columns = rows.length ? Object.keys(rows[0]) : [];

  const columnMeta: ColumnMeta[] = columns.map((col) => {
    const values = rows.map((r) => r[col]);
    const type = detectColumnType(values);
    return {
      name: col,
      normalizedName: normalizeColumnName(col),
      type,
    };
  });

  const lower = name.toLowerCase();
  let platform: SheetMeta["platform"] = "unknown";
  if (lower.includes("facebook")) platform = "facebook";
  else if (lower.includes("instagram")) platform = "instagram";
  else if (lower.includes("youtube")) platform = "youtube";

  let kind: SheetMeta["kind"] = "other";
  if (/_post$/i.test(name)) {
    kind = "post_level";
  } else if (
    /calculations/i.test(name) ||
    /source/i.test(name)
  ) {
    kind = "monthly_summary";
  } else if (
    ["facebook", "instagram", "youtube"].includes(lower)
  ) {
    kind = "platform_main";
  }

  return {
    name,
    platform,
    kind,
    rowCount,
    columns: columnMeta,
  };
}

function normalizeColumnName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return name;

  if (/^month(_\d+)?$/i.test(trimmed)) return "Month";
  if (/^sum of followers(_\d+)?$/i.test(trimmed))
    return "Followers (Sum)";
  if (/^sum of total impressions(_\d+)?$/i.test(trimmed))
    return "Total Impressions (Sum)";
  if (/^sum of reach(_\d+)?$/i.test(trimmed)) return "Reach (Sum)";
  if (/^sum of post video views(_\d+)?$/i.test(trimmed))
    return "Post Video Views (Sum)";
  if (/^followers \(as of 1st\)$/i.test(trimmed))
    return "Followers (As of 1st)";
  if (/^followers \(as of last day\)$/i.test(trimmed))
    return "Followers (As of last day)";

  return (
    trimmed
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export async function loadExcelFromFile(file: File): Promise<WorkbookData> {
  const buffer = await fileToArrayBuffer(file);
  return loadExcelFromArrayBuffer(buffer);
}

export function loadExcelFromArrayBuffer(buffer: ArrayBuffer): WorkbookData {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheets: SheetData[] = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });
    const meta = buildSheetMeta(name, rows);
    return {
      name,
      rows,
      meta,
    };
  });

  return { sheets };
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 10) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (!den) return 0;
  return num / den;
}

function pickFirstDateColumn(sheet: SheetData): string | undefined {
  return sheet.meta.columns.find((c) => c.type === "date")?.name;
}

function numericColumnExists(sheet: SheetData, matcher: RegExp): string | undefined {
  return sheet.meta.columns.find(
    (c) => c.type === "numeric" && matcher.test(c.name),
  )?.name;
}

function buildOverviewSection(sheets: SheetData[]): SectionModel {
  const charts: ChartConfig[] = [];
  const platforms = ["facebook", "instagram", "youtube"];

  charts.push({
    id: "overview-kpis",
    section: "overview",
    title: "All Platforms KPIs",
    type: "kpi",
    fields: [
      { role: "value", column: "Followers" },
      { role: "value", column: "Total Impressions" },
      { role: "value", column: "Reach" },
      { role: "value", column: "Engagement Rate" },
      { role: "value", column: "Video Views" },
    ],
  });

  const anySheet = sheets.find((s) => s.meta.kind === "platform_main");
  const dateCol = anySheet && pickFirstDateColumn(anySheet);
  if (dateCol) {
    charts.push({
      id: "overview-time-series",
      section: "overview",
      title: "Followers / Reach / Impressions Over Time",
      type: "line",
      fields: [
        { role: "x", column: dateCol },
        { role: "y", column: "Followers" },
        { role: "y", column: "Reach" },
        { role: "y", column: "Total Impressions" },
      ],
      platforms,
    });
  }

  charts.push({
    id: "overview-platform-comparison",
    section: "overview",
    title: "Platform Comparison (Impressions / Reach / Video Views)",
    type: "bar",
    fields: [
      { role: "x", column: "Platform" },
      { role: "y", column: "Total Impressions" },
    ],
  });

  charts.push({
    id: "overview-engagement-rate",
    section: "overview",
    title: "Engagement Rate Over Time",
    type: "line",
    fields: [
      { role: "x", column: dateCol || "Date" },
      { role: "y", column: "Engagement Rate" },
    ],
  });

  return {
    id: "overview",
    title: "Overview",
    charts: charts.slice(0, 6),
  };
}

function buildReachSection(sheets: SheetData[]): SectionModel {
  const charts: ChartConfig[] = [];

  charts.push({
    id: "reach-kpis",
    section: "reach",
    title: "Reach KPIs",
    type: "kpi",
    fields: [
      { role: "value", column: "Reach" },
      { role: "value", column: "Organic Reach" },
      { role: "value", column: "Paid Reach" },
      { role: "value", column: "Viral Reach" },
    ],
  });

  const fb = sheets.find((s) => s.meta.name === "Facebook");
  const ig = sheets.find((s) => s.meta.name === "Instagram");
  const yt = sheets.find((s) => s.meta.name === "Youtube");
  const dateCol =
    (fb && pickFirstDateColumn(fb)) ||
    (ig && pickFirstDateColumn(ig)) ||
    (yt && pickFirstDateColumn(yt)) ||
    "Date";

  charts.push({
    id: "reach-time-series",
    section: "reach",
    title: "Reach Over Time by Platform",
    type: "line",
    fields: [
      { role: "x", column: dateCol },
      { role: "y", column: "Reach" },
    ],
    platforms: ["facebook", "instagram", "youtube"],
  });

  charts.push({
    id: "reach-breakdown",
    section: "reach",
    title: "Reach Breakdown (Organic / Paid / Viral)",
    type: "pie",
    fields: [
      { role: "series", column: "Reach Type" },
      { role: "value", column: "Reach" },
    ],
  });

  charts.push({
    id: "reach-top-posts",
    section: "reach",
    title: "Top Posts By Reach",
    type: "bar",
    fields: [
      { role: "x", column: "Post" },
      { role: "y", column: "Reach" },
    ],
  });

  return {
    id: "reach",
    title: "Detailed Reach",
    charts: charts.slice(0, 6),
  };
}

function buildViewsSection(sheets: SheetData[]): SectionModel {
  const charts: ChartConfig[] = [];

  charts.push({
    id: "views-kpis",
    section: "views",
    title: "Views KPIs",
    type: "kpi",
    fields: [
      { role: "value", column: "Views" },
      { role: "value", column: "Video Views" },
      { role: "value", column: "Watch Time" },
      { role: "value", column: "Average View Duration" },
    ],
  });

  const any = sheets.find((s) => s.meta.kind === "platform_main");
  const dateCol = any && pickFirstDateColumn(any);

  charts.push({
    id: "views-time-series",
    section: "views",
    title: "Views Over Time",
    type: "line",
    fields: [
      { role: "x", column: dateCol || "Date" },
      { role: "y", column: "Video Views" },
    ],
  });

  charts.push({
    id: "views-top-videos",
    section: "views",
    title: "Top Videos By Views",
    type: "bar",
    fields: [
      { role: "x", column: "Post" },
      { role: "y", column: "Video Views" },
    ],
  });

  charts.push({
    id: "views-monthly-summary",
    section: "views",
    title: "Monthly Views Summary",
    type: "bar",
    fields: [
      { role: "x", column: "Month" },
      { role: "y", column: "Post Video Views (Sum)" },
    ],
  });

  charts.push({
    id: "views-scatter-reach-vs-views",
    section: "views",
    title: "Reach vs Video Views",
    type: "scatter",
    fields: [
      { role: "x", column: "Reach" },
      { role: "y", column: "Video Views" },
    ],
  });

  return {
    id: "views",
    title: "Detailed Views",
    charts: charts.slice(0, 6),
  };
}

function buildImpressionsSection(sheets: SheetData[]): SectionModel {
  const charts: ChartConfig[] = [];

  charts.push({
    id: "impressions-kpis",
    section: "impressions",
    title: "Impressions KPIs",
    type: "kpi",
    fields: [
      { role: "value", column: "Total Impressions" },
      { role: "value", column: "Organic Impressions" },
      { role: "value", column: "Paid Impressions" },
      { role: "value", column: "Viral Impressions" },
    ],
  });

  const any = sheets.find((s) => s.meta.kind === "platform_main");
  const dateCol = any && pickFirstDateColumn(any);

  charts.push({
    id: "impressions-time-series",
    section: "impressions",
    title: "Impressions Over Time",
    type: "line",
    fields: [
      { role: "x", column: dateCol || "Date" },
      { role: "y", column: "Total Impressions" },
    ],
  });

  charts.push({
    id: "impressions-breakdown",
    section: "impressions",
    title: "Impressions Breakdown (Organic / Paid / Viral)",
    type: "pie",
    fields: [
      { role: "series", column: "Impression Type" },
      { role: "value", column: "Total Impressions" },
    ],
  });

  charts.push({
    id: "impressions-monthly",
    section: "impressions",
    title: "Monthly Impressions Summary",
    type: "bar",
    fields: [
      { role: "x", column: "Month" },
      { role: "y", column: "Total Impressions (Sum)" },
    ],
  });

  return {
    id: "impressions",
    title: "Detailed Impressions",
    charts: charts.slice(0, 6),
  };
}

function buildEngagementSection(sheets: SheetData[]): SectionModel {
  const charts: ChartConfig[] = [];

  charts.push({
    id: "engagement-kpis",
    section: "engagement",
    title: "Engagement KPIs",
    type: "kpi",
    fields: [
      { role: "value", column: "Likes" },
      { role: "value", column: "Comments" },
      { role: "value", column: "Saves" },
      { role: "value", column: "Shares" },
      { role: "value", column: "Engagement Rate" },
    ],
  });

  const any = sheets.find((s) => s.meta.kind === "platform_main");
  const dateCol = any && pickFirstDateColumn(any);

  charts.push({
    id: "engagement-time-series",
    section: "engagement",
    title: "Engagement Over Time",
    type: "line",
    fields: [
      { role: "x", column: dateCol || "Date" },
      { role: "y", column: "Likes" },
      { role: "y", column: "Comments" },
      { role: "y", column: "Shares" },
    ],
  });

  charts.push({
    id: "engagement-leaderboard",
    section: "engagement",
    title: "Post-Level Engagement Leaderboard",
    type: "bar",
    fields: [
      { role: "x", column: "Post" },
      { role: "y", column: "Engagement" },
    ],
  });

  charts.push({
    id: "engagement-sentiment",
    section: "engagement",
    title: "Sentiment Breakdown",
    type: "bar",
    fields: [
      { role: "x", column: "Sentiment" },
      { role: "y", column: "Count" },
    ],
  });

  return {
    id: "engagement",
    title: "Detailed Engagement",
    charts: charts.slice(0, 6),
  };
}

export function buildDashboardModel(workbook: WorkbookData): DashboardModel {
  const sheets = workbook.sheets.filter((s) => s.meta.rowCount > 0);
  const sections: SectionModel[] = [
    buildOverviewSection(sheets),
    buildReachSection(sheets),
    buildViewsSection(sheets),
    buildImpressionsSection(sheets),
    buildEngagementSection(sheets),
  ];

  return { sheets, sections };
}


