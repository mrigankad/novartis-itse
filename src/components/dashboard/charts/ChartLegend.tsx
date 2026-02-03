import type { LegendProps } from "recharts";

export function ChartLegend({ payload }: LegendProps) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
      {payload.map((item, idx) => {
        const color = item.color ?? "hsl(var(--muted-foreground))";
        const value = item.value ?? item.dataKey ?? "";
        if (!value) return null;

        return (
          <div key={`${value}-${idx}`} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-foreground/80 font-medium">{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

