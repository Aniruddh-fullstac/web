"use client";

import { useMemo, useState } from "react";
import { loadExcelFromFile, buildDashboardModel } from "@/utils/loadExcel";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { FilterBar } from "@/components/layout/FilterBar";

type Filters = {
  platform: "all" | string;
  profile: "all" | string;
};

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<ReturnType<typeof buildDashboardModel> | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "reach" | "views" | "impressions" | "engagement">("overview");
  const [filters, setFilters] = useState<Filters>({ platform: "all", profile: "all" });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availablePlatforms = useMemo(() => {
    if (!model) return [];
    const set = new Set<string>();
    for (const sheet of model.sheets) {
      if (sheet.meta.platform !== "unknown") {
        set.add(sheet.meta.platform);
      }
    }
    return Array.from(set);
  }, [model]);

  const availableProfiles = useMemo(() => {
    if (!model) return [];
    const names = new Set<string>();
    for (const sheet of model.sheets) {
      for (const row of sheet.rows) {
        const v = row["Profile Name"];
        if (typeof v === "string" && v.trim()) {
          names.add(v);
        }
      }
    }
    return Array.from(names).slice(0, 50);
  }, [model]);

  const onFileChange = (f: File | null) => {
    setFile(f);
    setModel(null);
    setError(null);
  };

  const onLoad = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const workbook = await loadExcelFromFile(file);
      const model = buildDashboardModel(workbook);
      setModel(model);
    } catch (e: any) {
      setError(e?.message ?? "Failed to read Excel file");
    } finally {
      setLoading(false);
    }
  };

  const onPublishToSheets = async () => {
    if (!file) return;
    setPublishing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/publish", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      // Surface full response in dev console for debugging
      console.log("Publish /api/publish response:", { status: res.status, data });
      if (!res.ok) {
        throw new Error(
          data.error ||
            data.details ||
            (typeof data === "string" ? data : "Failed to publish to Google Sheets"),
        );
      }
      setSpreadsheetUrl(data.spreadsheetUrl);
    } catch (e: any) {
      setError(e?.message ?? "Failed to publish to Google Sheets");
    } finally {
      setPublishing(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!model) return {} as Record<string, any[]>;
    const result: Record<string, any[]> = {};

    const platformLabel = (p: string) =>
      p === "facebook" ? "Facebook" : p === "instagram" ? "Instagram" : p === "youtube" ? "Youtube" : p;

    for (const sheet of model.sheets) {
      let rows = sheet.rows;
      if (filters.platform !== "all") {
        rows = rows.filter(() => sheet.meta.platform === filters.platform);
      }
      if (filters.profile !== "all") {
        rows = rows.filter((r) => r["Profile Name"] === filters.profile);
      }
      rows = rows.map((r) => ({
        Platform: platformLabel(sheet.meta.platform),
        ...r,
      }));
      result[sheet.name] = rows;
    }
    return result;
  }, [model, filters]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Social Analytics Looker-style Dashboard
          </h1>
          <p className="text-sm text-zinc-400">
            Upload your Fevicryl Excel export and explore Overview, Reach, Views, Impressions and Engagement across Facebook, Instagram and YouTube.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Data Source
            </p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                className="text-xs text-zinc-300"
              />
              <button
                onClick={onLoad}
                disabled={!file || loading}
                className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-500 px-3 text-xs font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {loading ? "Loading workbook..." : "Build dashboard"}
              </button>
              <button
                onClick={onPublishToSheets}
                disabled={!file || publishing}
                className="inline-flex h-8 items-center justify-center rounded-md bg-sky-500 px-3 text-xs font-medium text-sky-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {publishing ? "Publishing to Sheets..." : "Publish for Looker Studio"}
              </button>
            </div>
            {file && (
              <p className="text-[11px] text-zinc-500">
                Selected file: <span className="font-medium text-zinc-200">{file.name}</span>
              </p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {spreadsheetUrl && (
              <p className="text-[11px] text-emerald-400">
                Google Sheet ready for Looker Studio:{" "}
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Open Sheet
                </a>
              </p>
            )}
          </div>

          <FilterBar
            availablePlatforms={availablePlatforms}
            availableProfiles={availableProfiles}
            value={filters}
            onChange={setFilters}
          />
        </section>

        {model && (
          <>
            <nav className="flex gap-2 border-b border-zinc-800 text-xs">
              {model.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() =>
                    setActiveTab(section.id as typeof activeTab)
                  }
                  className={`rounded-t-md px-3 py-2 font-medium ${
                    activeTab === section.id
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>

            <main className="space-y-4">
              {model.sections
                .filter((s) => s.id === activeTab)
                .map((section) => (
                  <div key={section.id} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {section.charts.map((chart) => (
                        <div
                          key={chart.id}
                          className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                        >
                          <p className="text-xs font-semibold text-zinc-200">
                            {chart.title}
                          </p>
                          <ChartRenderer
                            chart={chart}
                            data={flattenSectionData(model, filteredData, chart.section)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

function flattenSectionData(
  model: ReturnType<typeof buildDashboardModel>,
  bySheet: Record<string, any[]>,
  section: "overview" | "reach" | "views" | "impressions" | "engagement",
) {
  const sheetsForSection = model.sheets.filter((sheet) => {
    if (section === "overview") return sheet.meta.kind === "platform_main";
    if (section === "reach") return sheet.meta.kind === "platform_main" || sheet.meta.kind === "post_level";
    if (section === "views") return true;
    if (section === "impressions") return true;
    if (section === "engagement") return true;
    return false;
  });

  const rows: any[] = [];
  for (const sheet of sheetsForSection) {
    rows.push(...(bySheet[sheet.name] ?? []));
  }
  return rows;
}


