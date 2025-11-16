"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from "recharts";
import type {
  ChartConfig,
  DashboardModel,
  SectionId,
} from "@/utils/loadExcel";

type ChartRendererProps = {
  chart: ChartConfig;
  data: any[];
};

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"];

export function ChartRenderer({ chart, data }: ChartRendererProps) {
  if (chart.type === "kpi") {
    return <KpiCards chart={chart} data={data} />;
  }
  if (chart.type === "table") {
    return <TableChart data={data} />;
  }
  if (chart.type === "line") {
    return <TimeSeriesChart chart={chart} data={data} />;
  }
  if (chart.type === "bar") {
    return <CategoryBarChart chart={chart} data={data} />;
  }
  if (chart.type === "pie") {
    return <PieChartComp chart={chart} data={data} />;
  }
  if (chart.type === "scatter") {
    return <ScatterChartComp chart={chart} data={data} />;
  }
  return null;
}

function getField(chart: ChartConfig, role: string) {
  return chart.fields.find((f) => f.role === role)?.column;
}

function TimeSeriesChart({
  chart,
  data,
}: {
  chart: ChartConfig;
  data: any[];
}) {
  const xField = getField(chart, "x");
  const yFields = chart.fields.filter((f) => f.role === "y");
  if (!xField || !yFields.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey={xField}
          stroke="#a1a1aa"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Legend />
        {yFields.map((f, idx) => (
          <Line
            key={f.column}
            type="monotone"
            dataKey={f.column}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({
  chart,
  data,
}: {
  chart: ChartConfig;
  data: any[];
}) {
  const xField = getField(chart, "x");
  const yField = getField(chart, "y");
  if (!xField || !yField) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey={xField}
          stroke="#a1a1aa"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Bar dataKey={yField} fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartComp({
  chart,
  data,
}: {
  chart: ChartConfig;
  data: any[];
}) {
  const seriesField = getField(chart, "series");
  const valueField = getField(chart, "value");
  if (!seriesField || !valueField) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Pie
          data={data}
          dataKey={valueField}
          nameKey={seriesField}
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScatterChartComp({
  chart,
  data,
}: {
  chart: ChartConfig;
  data: any[];
}) {
  const xField = getField(chart, "x");
  const yField = getField(chart, "y");
  if (!xField || !yField) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey={xField}
          stroke="#a1a1aa"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          dataKey={yField}
          stroke="#a1a1aa"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Scatter data={data} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function KpiCards({ chart, data }: { chart: ChartConfig; data: any[] }) {
  const latest = data[data.length - 1] || {};
  const fields = chart.fields.filter((f) => f.role === "value");
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {fields.map((f, idx) => (
        <div
          key={f.column}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {f.column}
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-50">
            {formatNumber(latest[f.column as keyof typeof latest])}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: unknown) {
  if (typeof value !== "number") return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function TableChart({ data }: { data: any[] }) {
  const rows = data.slice(0, 50);
  const cols = rows.length ? Object.keys(rows[0]) : [];
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-500">
        No data available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="max-h-80 overflow-auto text-xs">
        <table className="min-w-full border-collapse">
          <thead className="bg-zinc-900/80">
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="sticky top-0 border-b border-zinc-800 px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="even:bg-zinc-900/40">
                {cols.map((c) => (
                  <td key={c} className="border-b border-zinc-900 px-3 py-1.5">
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


