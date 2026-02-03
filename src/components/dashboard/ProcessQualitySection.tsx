import { useMemo } from "react";
import { RotateCcw, ArrowRightLeft, TrendingDown } from "lucide-react";
import { ReopenTrendChart } from "./charts/ReopenTrendChart";
import { useFilters } from "@/contexts/FilterContext";
import { getFilteredTickets, calculateKPIs } from "@/data/realData";
import { InfoTooltip, type InfoTooltipContent } from "@/components/ui/info-tooltip";
import { dashboardTooltips } from "@/config/tooltips";

interface QualityMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  chart?: React.ReactNode;
  info?: InfoTooltipContent;
}

function QualityMetric({ icon, label, value, sublabel, chart, info }: QualityMetricProps) {
  return (
    <div className="kpi-card flex flex-col bg-card border border-border rounded-lg p-5 lg:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary flex-shrink-0">{icon}</div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate flex-1 min-w-0">{label}</span>
        {info && <InfoTooltip content={info} className="-mr-1" />}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {sublabel && (
          <span className="text-sm text-muted-foreground">{sublabel}</span>
        )}
      </div>
      {chart && <div className="mt-3">{chart}</div>}
    </div>
  );
}

export function ProcessQualitySection() {
  const { filters } = useFilters();
  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const kpis = useMemo(() => calculateKPIs(filteredTickets), [filteredTickets]);
  
  // Calculate reopened tickets (tickets with "reopen" in title or status changes)
  const reopenedTickets = useMemo(() => {
    return filteredTickets.filter((t) => {
      if (typeof t.reopenCount === "number") return t.reopenCount > 0;
      const title = (t.title ?? "").toLowerCase();
      const status = (t.status ?? "").toLowerCase();
      return title.includes("reopen") || title.includes("re-open") || status.includes("reopen");
    }).length;
  }, [filteredTickets]);

  return (
    <div className="grid gap-4 lg:gap-5 grid-cols-1 md:grid-cols-3">
      <QualityMetric
        icon={<RotateCcw className="h-4 w-4" />}
        label="Re-opened Tickets"
        value={reopenedTickets}
        sublabel="this period"
        info={dashboardTooltips.quality.reopenedTickets}
      />
      <QualityMetric
        icon={<ArrowRightLeft className="h-4 w-4" />}
        label="High-Hop Tickets (≥3)"
        value={kpis.highHopTickets}
        sublabel="this period"
        info={dashboardTooltips.quality.highHopTickets}
      />
      <QualityMetric
        icon={<TrendingDown className="h-4 w-4" />}
        label="Re-open Rate Trend"
        value={`${kpis.reopenRate}%`}
        sublabel="current"
        chart={<ReopenTrendChart />}
        info={dashboardTooltips.quality.reopenRateTrend}
      />
    </div>
  );
}
