export type TableMeta = {
  sheetName: string;
  tableIndex: number;
  headerRow: number;
  startRow: number;
  endRow: number;
};

export type NormalizedTable = {
  meta: TableMeta & {
    platform: "facebook" | "instagram" | "youtube" | "unknown";
    metricType:
      | "overview"
      | "reach"
      | "views"
      | "impressions"
      | "engagement"
      | "other";
    tableType: string;
  };
  columns: string[];
  rows: Record<string, string | number | null>[];
};

export type MergedDataset = {
  overview: NormalizedTable;
  reach: NormalizedTable;
  views: NormalizedTable;
  impressions: NormalizedTable;
  engagement: NormalizedTable;
};


