import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * A KPI tile.
 *
 * Pastel fill, a real dark hairline, one big number. The dark edge is doing the
 * work: four pastels in a row with tinted borders turn into a smear, and each
 * tile has to read as a drawn object before it reads as a colour.
 *
 * There is no sparkline. The reference layout has one on every tile, but this
 * panel has a count and nothing behind it — no series, no history — and a chart
 * drawn from nothing would be a picture of data that does not exist. The tone
 * carries the distinction between tiles instead.
 */
export type StatTone = "pink" | "mint" | "green" | "lilac" | "sun";

const TONES: Record<StatTone, string> = {
  pink: "bg-pastel-pink",
  mint: "bg-pastel-mint",
  green: "bg-pastel-green",
  lilac: "bg-pastel-lilac",
  sun: "bg-pastel-sun",
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
    <div className={`kpi flex flex-col justify-between p-5 ${TONES[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[13px] font-extrabold text-chalk">{label}</span>
          {sublabel ? (
            <span className="mt-0.5 block text-[11px] font-medium text-chalk/60">{sublabel}</span>
          ) : null}
        </div>
        {icon ? <span className="shrink-0 text-chalk/50">{icon}</span> : null}
      </div>

      <span className="mt-6 block text-[34px] font-black leading-none tracking-tight text-chalk tabular-nums">
        {value}
      </span>

      {badge ? (
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-chalk/20 bg-white/55 px-2.5 py-1 text-[10px] font-extrabold text-chalk">
          <ArrowUpRight className="h-3 w-3" strokeWidth={3} />
          {badge}
        </span>
      ) : null}
    </div>
  );
}
