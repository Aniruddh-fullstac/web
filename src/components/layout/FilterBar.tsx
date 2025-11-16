"use client";

type FilterBarProps = {
  availablePlatforms: string[];
  availableProfiles: string[];
  value: {
    platform: string | "all";
    profile: string | "all";
  };
  onChange: (value: FilterBarProps["value"]) => void;
};

export function FilterBar({
  availablePlatforms,
  availableProfiles,
  value,
  onChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Platform
        </p>
        <select
          className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
          value={value.platform}
          onChange={(e) =>
            onChange({
              ...value,
              platform: e.target.value as FilterBarProps["value"]["platform"],
            })
          }
        >
          <option value="all">All</option>
          {availablePlatforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Profile
        </p>
        <select
          className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
          value={value.profile}
          onChange={(e) =>
            onChange({
              ...value,
              profile: e.target.value as FilterBarProps["value"]["profile"],
            })
          }
        >
          <option value="all">All</option>
          {availableProfiles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


