import * as XLSX from "xlsx";
import type { TableMeta } from "./types";

export type DetectedTable = {
  meta: TableMeta;
  headers: string[];
  rows: (string | number | null)[][];
};

export function detectTablesFromWorkbook(
  workbook: XLSX.WorkBook,
): DetectedTable[] {
  const tables: DetectedTable[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    if (sheetName.toLowerCase() === "sheet1") return;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const sheetJson: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    let currentStart: number | null = null;
    let tableIndex = 0;

    const isBlankRow = (row: any[] | undefined) =>
      !row || row.every((cell) => cell === null || cell === "" || cell === undefined);

    for (let i = 0; i <= sheetJson.length; i++) {
      const row = sheetJson[i];

      if (currentStart === null) {
        if (!isBlankRow(row)) {
          currentStart = i;
        }
      } else {
        if (i === sheetJson.length || isBlankRow(row)) {
          const endRow = i - 1;
          if (endRow > currentStart) {
            const headerRow = currentStart;
            const headers = (sheetJson[headerRow] || []).map((h) =>
              String(h ?? "").trim(),
            );
            const dataRows = sheetJson.slice(headerRow + 1, endRow + 1);

            if (headers.some((h) => h.length > 0) && dataRows.length > 0) {
              tables.push({
                meta: {
                  sheetName,
                  tableIndex,
                  headerRow,
                  startRow: currentStart,
                  endRow,
                },
                headers,
                rows: dataRows,
              });
              tableIndex++;
            }
          }
          currentStart = null;
        }
      }
    }
  });

  return tables;
}


