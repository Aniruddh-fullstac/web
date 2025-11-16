import Link from "next/link";

type ResultPageProps = {
  searchParams: {
    spreadsheetUrl?: string;
  };
};

export default function ResultPage({ searchParams }: ResultPageProps) {
  const spreadsheetUrl = searchParams.spreadsheetUrl;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard Ready
          </h1>
          <p className="text-sm text-zinc-400">
            Your unified reporting sheet is live. Connect it to your Looker
            Studio template and you&apos;re good to go.
          </p>
        </header>

        <main className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          {spreadsheetUrl ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-100">
                  Google Sheet
                </p>
                <Link
                  href={spreadsheetUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-emerald-950 transition hover:bg-emerald-400"
                >
                  Open in Google Sheets
                </Link>
              </div>
              <div className="space-y-2 text-xs text-zinc-400">
                <p>
                  Tabs created:
                  <span className="ml-1 font-medium text-zinc-200">
                    Overview, Reach, Views, Impressions, Engagement
                  </span>
                </p>
                <p>
                  You can now:
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    Point your Looker Studio data source at this sheet.
                  </li>
                  <li>
                    Duplicate your dashboard template and swap the data source.
                  </li>
                  <li>
                    Re-run uploads whenever new Excel exports are available.
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-400">
              Missing spreadsheet URL. Try re-running the upload from the{" "}
              <Link href="/upload" className="underline">
                upload page
              </Link>
              .
            </p>
          )}
          <div className="pt-4">
            <Link
              href="/upload"
              className="inline-flex items-center text-xs font-medium text-zinc-300 underline underline-offset-4 hover:text-zinc-100"
            >
              Run another upload
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}


