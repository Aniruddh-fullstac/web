"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "done" | "error";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles(arr);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const onUpload = async () => {
    if (!files.length) return;
    setState("uploading");
    setLogs([]);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setError(data.error || "Upload failed");
        setLogs((prev) => [...prev, data.details || ""]);
        return;
      }

      setLogs(data.logs ?? []);
      setState("done");

      const params = new URLSearchParams({
        spreadsheetUrl: data.spreadsheetUrl,
      });
      router.push(`/result?${params.toString()}`);
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Unexpected error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Social Analytics Excel → Looker Studio
          </h1>
          <p className="text-sm text-zinc-400">
            Upload your Fevicryl Excel (or similar). We&apos;ll auto-detect tables,
            normalize with AI, merge metrics, and publish a clean Google Sheet
            ready for Looker Studio.
          </p>
          <p className="text-xs text-zinc-500">
            Reference file path: /Users/aniruddh/Desktop/lookere/Copy of
            Fevicryl.xlsx
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div
              className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 px-6 py-10 text-center transition hover:border-zinc-400"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={onDrop}
            >
              <p className="text-sm font-medium text-zinc-100">
                Drag &amp; drop Excel/CSV files here
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                We&apos;ll scan all sheets and tables automatically.
              </p>
              <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white">
                Browse files
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
              <p className="mt-3 text-[11px] text-zinc-500">
                Tip: Start with &quot;Copy of Fevicryl.xlsx&quot; to mirror your
                production pipeline.
              </p>
            </div>

            {files.length > 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Selected files
                </p>
                <ul className="space-y-1 text-xs text-zinc-200">
                  {files.map((file) => (
                    <li key={file.name} className="flex justify-between">
                      <span>{file.name}</span>
                      <span className="text-zinc-500">
                        {Math.round(file.size / 1024)} KB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onUpload}
              disabled={state === "uploading" || !files.length}
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {state === "uploading"
                ? "Processing with AI..."
                : "Generate Google Sheet"}
            </button>

            {error && (
              <p className="text-xs text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-zinc-200">Processing log</p>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                {state === "idle" && "Idle"}
                {state === "uploading" && "Running"}
                {state === "done" && "Completed"}
                {state === "error" && "Error"}
              </span>
            </div>
            <div className="h-64 overflow-y-auto rounded-md bg-zinc-950/70 p-3 font-mono text-[11px] text-zinc-400">
              {logs.length === 0 && (
                <p className="text-zinc-500">
                  Logs will appear here as we detect tables, normalize with AI, and publish to Google Sheets.
                </p>
              )}
              {logs.map((log, idx) => (
                <p key={`${log}-${idx}`} className="whitespace-pre-wrap">
                  {log}
                </p>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">
              Sheets created: Overview, Reach, Views, Impressions, Engagement — ready to plug into a Looker Studio template.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


