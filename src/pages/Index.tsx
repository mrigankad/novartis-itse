import { useMemo } from "react";
import { Ticket, AlertTriangle, Clock, RotateCcw, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TicketInflowChart } from "@/components/dashboard/charts/TicketInflowChart";
import { BacklogTrendChart } from "@/components/dashboard/charts/BacklogTrendChart";
import { PriorityDistributionChart } from "@/components/dashboard/charts/PriorityDistributionChart";
import { MTTRByPriorityChart } from "@/components/dashboard/charts/MTTRByPriorityChart";
import { AgeingBucketsChart } from "@/components/dashboard/charts/AgeingBucketsChart";
import { BacklogByGroupChart } from "@/components/dashboard/charts/BacklogByGroupChart";
import { MTTRTrendChart } from "@/components/dashboard/charts/MTTRTrendChart";
import { BacklogByAssignedToChart } from "@/components/dashboard/charts/BacklogByAssignedToChart";
import { SLATrackingChart } from "@/components/dashboard/charts/SLATrackingChart";
import { SLAToBeBreachedChart } from "@/components/dashboard/charts/SLAToBeBreachedChart";
import { TotalTicketsDonutChart } from "@/components/dashboard/charts/TotalTicketsDonutChart";
import { useFilters } from "@/contexts/FilterContext";
import { getFilteredTickets, calculateKPIs } from "@/data/realData";
import { dashboardTooltips } from "@/config/tooltips";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDaysInclusive(start: Date, end: Date) {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.max(1, Math.round((e - s) / MS_PER_DAY) + 1);
}

function parseCreated(value: string) {
  return new Date(value.replace(" ", "T"));
}

function parseDateOnlyLocal(value: string) {
  const [y, m, d] = value.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function getTrendWindow(filters: { dateRange: string; customStartDate?: string; customEndDate?: string }) {
  const now = new Date();

  if (filters.dateRange === "all") return null;

  if (filters.dateRange === "custom" && filters.customStartDate && filters.customEndDate) {
    const start = startOfDay(parseDateOnlyLocal(filters.customStartDate));
    const end = startOfDay(parseDateOnlyLocal(filters.customEndDate));
    const days = diffDaysInclusive(start, end);
    return { start, days, label: `vs previous ${days} days` };
  }

  if (filters.dateRange === "today") {
    return { start: startOfDay(now), days: 1, label: "vs previous day" };
  }

  if (filters.dateRange === "mtd") {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const days = diffDaysInclusive(start, now);
    return { start, days, label: `vs previous ${days} days` };
  }

  if (filters.dateRange === "qtd") {
    const quarter = Math.floor(now.getMonth() / 3);
    const start = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
    const days = diffDaysInclusive(start, now);
    return { start, days, label: `vs previous ${days} days` };
  }

  const ranges: Record<string, number> = { "7d": 7, "15d": 15, "30d": 30, "90d": 90, ytd: 365 };
  const days = ranges[filters.dateRange] ?? 15;
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
  return { start, days, label: `vs previous ${days} days` };
}

const Index = () => {
  const { filters } = useFilters();

  // Get filtered tickets and calculate KPIs
  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const kpis = useMemo(() => calculateKPIs(filteredTickets), [filteredTickets]);

  const trendWindow = useMemo(
    () => getTrendWindow({ dateRange: filters.dateRange, customStartDate: filters.customStartDate, customEndDate: filters.customEndDate }),
    [filters.dateRange, filters.customStartDate, filters.customEndDate],
  );

  // Calculate trends (comparing to previous period - same duration immediately before current period)
  const previousPeriodTickets = useMemo(() => {
    if (!trendWindow) return [];

    const previousPeriodEnd = trendWindow.start;
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodEnd.getDate() - trendWindow.days);

    const wide = getFilteredTickets({ ...filters, dateRange: "ytd", customStartDate: undefined, customEndDate: undefined });

    return wide.filter((t) => {
      const ticketDate = parseCreated(t.created);
      return ticketDate >= previousPeriodStart && ticketDate < previousPeriodEnd;
    });
  }, [filters, trendWindow]);

  const prevKPIs = useMemo(() => calculateKPIs(previousPeriodTickets), [previousPeriodTickets]);

  const calculateTrend = (current: string | number, previous: string | number) => {
    const curr = typeof current === "string" ? parseFloat(current) : current;
    const prev = typeof previous === "string" ? parseFloat(previous) : previous;

    if (prev === 0) {
      if (curr > 0) return { value: 100, direction: "up" as const, label: trendWindow?.label ?? "vs last period" };
      return { value: 0, direction: "neutral" as const, label: trendWindow?.label ?? "vs last period" };
    }
    const change = ((curr - prev) / prev) * 100;
    return {
      value: parseFloat(Math.abs(change).toFixed(1)),
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "neutral" as const,
      label: trendWindow?.label ?? "vs last period",
    };
  };

  return (
    <div id="dashboard-export-root" className="min-h-screen bg-dashboard-bg w-full pb-10">
      <div className="w-full">
        {/* Header */}
        <div className="bg-card border-b border-border shadow-md w-full">
          <div className="w-full px-6 lg:px-10 py-5 lg:py-6">
            <DashboardHeader />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-6 lg:px-10 py-6 lg:py-8">
          {/* KPI Summary Row */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
              <KPICard
                title="Total Tickets"
                value={kpis.totalTickets.toLocaleString()}
                trend={trendWindow ? calculateTrend(kpis.totalTickets, prevKPIs.totalTickets) : undefined}
                status="neutral"
                icon={<Ticket className="h-5 w-5" />}
                info={dashboardTooltips.kpis.totalTickets}
                delay={0}
              />
              <KPICard
                title="Backlog Tickets"
                value={kpis.backlogTickets.toLocaleString()}
                trend={trendWindow ? calculateTrend(kpis.backlogTickets, prevKPIs.backlogTickets) : undefined}
                trendIsGood={false}
                status={kpis.backlogTickets > 400 ? "high" : kpis.backlogTickets > 200 ? "moderate" : "low"}
                icon={<AlertTriangle className="h-5 w-5" />}
                info={dashboardTooltips.kpis.backlogTickets}
                delay={50}
              />
              <KPICard
                title="SLA Met %"
                value={kpis.slaMetRate}
                suffix="%"
                trend={trendWindow ? calculateTrend(kpis.slaMetRate, prevKPIs.slaMetRate) : undefined}
                status={parseFloat(kpis.slaMetRate) < 85 ? "high" : parseFloat(kpis.slaMetRate) < 95 ? "moderate" : "low"}
                icon={<ShieldCheck className="h-5 w-5" />}
                info={dashboardTooltips.kpis.slaMetRate}
                delay={100}
              />
              <KPICard
                title="MTTR"
                value={kpis.mttr}
                suffix="hrs"
                trend={trendWindow ? calculateTrend(kpis.mttr, prevKPIs.mttr) : undefined}
                trendIsGood={false}
                status={parseFloat(kpis.mttr) > 24 ? "high" : parseFloat(kpis.mttr) > 12 ? "moderate" : "low"}
                icon={<Clock className="h-5 w-5" />}
                info={dashboardTooltips.kpis.mttr}
                delay={150}
              />
              <KPICard
                title="Re-open Rate"
                value={kpis.reopenRate}
                suffix="%"
                trend={trendWindow ? calculateTrend(kpis.reopenRate, prevKPIs.reopenRate) : undefined}
                trendIsGood={false}
                status={parseFloat(kpis.reopenRate) > 5 ? "high" : parseFloat(kpis.reopenRate) > 3 ? "moderate" : "low"}
                icon={<RotateCcw className="h-5 w-5" />}
                info={dashboardTooltips.kpis.reopenRate}
                delay={200}
              />
              <KPICard
                title="High-Hop Tickets"
                value={kpis.highHopTickets.toLocaleString()}
                trend={trendWindow ? calculateTrend(kpis.highHopTickets, prevKPIs.highHopTickets) : undefined}
                trendIsGood={false}
                status={kpis.highHopTickets > 50 ? "high" : kpis.highHopTickets > 30 ? "moderate" : "low"}
                icon={<ArrowRightLeft className="h-5 w-5" />}
                info={dashboardTooltips.kpis.highHopTickets}
                delay={250}
              />
            </div>
          </section>

          {/* Total Tickets Overview */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <ChartCard
                title="Total Tickets Overview"
                subtitle="Open vs Closed tickets distribution"
                info={dashboardTooltips.charts.totalTicketsOverview}
              >
                <TotalTicketsDonutChart />
              </ChartCard>
              <ChartCard
                title="MTTR Trend Over Time"
                subtitle="Mean Time to Resolve in hours"
                info={dashboardTooltips.charts.mttrTrendOverTime}
              >
                <MTTRTrendChart />
              </ChartCard>
            </div>
          </section>

          {/* SLA Section */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <ChartCard
                title="SLA Tracking (P1-P4)"
                subtitle="Percentage of tickets meeting SLA"
                info={dashboardTooltips.charts.slaTracking}
              >
                <SLATrackingChart />
              </ChartCard>
              <ChartCard
                title="SLA to be Breached"
                subtitle="Tickets at risk of SLA breach by priority"
                info={dashboardTooltips.charts.slaToBeBreached}
              >
                <SLAToBeBreachedChart />
              </ChartCard>
            </div>
          </section>

          {/* Backlog by Assigned To Section */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1">
              <ChartCard
                title="Backlog by Assigned To"
                subtitle="Distribution of open tickets by person and aging"
                info={dashboardTooltips.charts.backlogByAssignedTo}
              >
                <BacklogByAssignedToChart />
              </ChartCard>
            </div>
          </section>

          {/* Trends Section */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <ChartCard
                title="Ticket Inflow Trend"
                subtitle="Daily new incidents over time"
                info={dashboardTooltips.charts.ticketInflowTrend}
              >
                <TicketInflowChart />
              </ChartCard>
              <ChartCard
                title="Backlog Trend"
                subtitle="Open tickets over time"
                info={dashboardTooltips.charts.backlogTrend}
              >
                <BacklogTrendChart />
              </ChartCard>
            </div>
          </section>

          {/* Priority & Risk Section */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <ChartCard
                title="Ticket Distribution by Priority"
                subtitle="All tickets in the current selection"
                info={dashboardTooltips.charts.ticketDistributionByPriority}
              >
                <PriorityDistributionChart />
              </ChartCard>
              <ChartCard
                title="Mean Time to Resolve by Priority"
                subtitle="Average resolution time in hours"
                info={dashboardTooltips.charts.mttrByPriority}
              >
                <MTTRByPriorityChart />
              </ChartCard>
            </div>
          </section>

          {/* Ageing & Operations Section */}
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
              <ChartCard
                title="Ticket Ageing Buckets"
                subtitle="Distribution by age and priority"
                info={dashboardTooltips.charts.ticketAgeingBuckets}
              >
                <AgeingBucketsChart />
              </ChartCard>
              <ChartCard
                title="Backlog by Assignment Group"
                subtitle="L1, L2, and L3 support levels"
                info={dashboardTooltips.charts.backlogByAssignmentGroup}
              >
                <BacklogByGroupChart />
              </ChartCard>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-8 lg:mt-10 border-t border-border pt-5 lg:pt-6 pb-5 lg:pb-6">
            <p className="text-xs text-muted-foreground">
              Data refreshed: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} • Source: ServiceNow ITSM
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
