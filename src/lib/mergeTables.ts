import type { MergedDataset, NormalizedTable } from "./types";

function mergeByMetricType(
  tables: NormalizedTable[],
  metricType:
    | "overview"
    | "reach"
    | "views"
    | "impressions"
    | "engagement",
): NormalizedTable {
  const filtered = tables.filter((t) => t.meta.metricType === metricType);

  const allColumns = Array.from(
    new Set(filtered.flatMap((t) => t.columns)),
  );

  const rows: Record<string, string | number | null>[] = [];

  for (const table of filtered) {
    for (const row of table.rows) {
      const mergedRow: Record<string, string | number | null> = {};
      for (const col of allColumns) {
        mergedRow[col] = row[col] ?? null;
      }
      rows.push(mergedRow);
    }
  }

  const baseMeta =
    filtered[0]?.meta ??
    ({
      sheetName: "virtual",
      tableIndex: 0,
      headerRow: 0,
      startRow: 0,
      endRow: 0,
      platform: "unknown",
      metricType,
      tableType: `${metricType}_merged`,
    } as NormalizedTable["meta"]);

  return {
    meta: baseMeta,
    columns: allColumns,
    rows,
  };
}

export function buildMergedDataset(
  tables: NormalizedTable[],
): MergedDataset {
  return {
    overview: mergeByMetricType(tables, "overview"),
    reach: mergeByMetricType(tables, "reach"),
    views: mergeByMetricType(tables, "views"),
    impressions: mergeByMetricType(tables, "impressions"),
    engagement: mergeByMetricType(tables, "engagement"),
  };
}


