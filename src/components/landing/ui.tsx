// Presentational building blocks shared by the landing sections and
// the feature previews. No state, so they render on the server too.

export function DashboardStat({
  label,
  value,
  count,
  decimals = 2,
  suffix = "M",
  dark = false,
  highlight = false,
}: {
  label: string;
  value?: string;
  count?: number;
  decimals?: number;
  suffix?: string;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        dark
          ? "bg-forest text-white"
          : highlight
          ? "bg-mist"
          : "border border-line bg-white/70"
      }`}
    >
      <p className={`text-[9px] ${dark ? "text-white/60" : "text-sage"}`}>{label}</p>
      <p className={`mt-1.5 text-sm font-bold tabular-nums ${dark ? "text-white" : "text-ink"}`}>
        {count !== undefined ? (
          <>
            Rp{" "}
            <span data-count={count} data-decimals={decimals}>
              {count.toLocaleString("en-US", { minimumFractionDigits: decimals })}
            </span>
            {suffix}
          </>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export function OverviewStat({
  label,
  value,
  note,
  dark = false,
  highlight = false,
}: {
  label: string;
  value: string;
  note: string;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        dark ? "bg-forest text-white" : highlight ? "bg-mist" : "border border-line bg-cream"
      }`}
    >
      <p className={`text-[10px] ${dark ? "text-white/60" : "text-sage"}`}>{label}</p>
      <p className={`mt-2 text-base font-bold ${dark ? "text-white" : "text-ink"}`}>{value}</p>
      <p className={`mt-1 text-[9px] ${dark ? "text-white/60" : "text-sage"}`}>{note}</p>
    </div>
  );
}

export function MiniProgress({ value, color = "bg-forest" }: { value: string; color?: string }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
      <div data-grow="x" className={`h-full rounded-full ${color}`} style={{ width: value }} />
    </div>
  );
}

export function BudgetRow({
  label,
  value,
  progress,
  color = "bg-forest",
}: {
  label: string;
  value: string;
  progress: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-semibold text-forest">{label}</span>
        <span className="text-sage">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div data-grow="x" className={`h-full rounded-full ${color}`} style={{ width: progress }} />
      </div>
    </div>
  );
}

export function DebtRow({ name, value, progress }: { name: string; value: string; progress: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold text-ink">{name}</span>
        <span className="text-sage">{value}</span>
      </div>
      <MiniProgress value={progress} color="bg-sage" />
    </div>
  );
}

export function CategoryLegend({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="min-w-16 text-slate">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

// Paired income/expense bars used in several mock charts.
export function CashFlowBars({
  heights,
  className = "h-32",
  ratio = 0.65,
}: {
  heights: number[];
  className?: string;
  ratio?: number;
}) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {heights.map((height, index) => (
        <div key={index} className="flex h-full flex-1 items-end justify-center gap-1">
          <div
            data-grow
            className="w-[44%] rounded-t-md bg-moss"
            style={{ height: `${height * ratio}%`, ["--d" as string]: `${index * 60}ms` }}
          />
          <div
            data-grow
            className="w-[44%] rounded-t-md bg-forest"
            style={{ height: `${height}%`, ["--d" as string]: `${index * 60 + 40}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
