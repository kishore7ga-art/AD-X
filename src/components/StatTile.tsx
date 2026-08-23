import type { ReactNode } from "react";

/**
 * A KPI tile.
 *
 * White card, hairline border, small grey label over a large number, and a
 * status chip in the corner. The card itself carries no colour — that is the
 * whole difference from the pastel version this replaces. On a console screen
 * the tiles sit above lists and tables that are also white, and a row of
 * coloured blocks makes the numbers read as decoration; keeping the fill neutral
 * means the one coloured thing on the tile is the chip, which is the part that
 * actually says something.
 *
 * There is no sparkline. The reference layout has one, but this panel has a
 * count and nothing behind it — no series, no history — and a chart drawn from
 * nothing would be a picture of data that does not exist.
 */
export type StatTone = "pink" | "mint" | "green" | "lilac" | "sun";

/**
 * Tones are named after the old pastels so the call sites did not have to
 * change, but they now pick a chip rather than a background. The mapping is by
 * meaning: greens for healthy, amber for waiting, grey for a plain total.
 */
const CHIP: Record<StatTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  mint: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sun: "border-amber-200 bg-amber-50 text-amber-700",
  pink: "border-blue-200 bg-blue-50 text-blue-700",
  lilac: "border-night-line bg-night text-chalk-dim",
};

export function StatTile({
  label,
  value,
  sublabel,
  badge,
  tone = "lilac",
  icon,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  badge?: string;
  tone?: StatTone;
  icon?: ReactNode;
}) {
  return (
    <div className="kpi flex flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-chalk-dim">
          <span className="truncate">{label}</span>
          {icon ? <span className="shrink-0 text-chalk-dim/70">{icon}</span> : null}
        </span>
        {badge ? (
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CHIP[tone]}`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <span className="mt-4 block text-[30px] font-bold leading-none tracking-tight text-chalk tabular-nums">
        {value}
      </span>

      {sublabel ? (
        <span className="mt-2 block text-[12px] font-normal text-chalk-dim">{sublabel}</span>
      ) : null}
    </div>
  );
}
