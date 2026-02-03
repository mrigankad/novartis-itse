import { useMemo } from "react";
import { Ticket, AlertTriangle, Clock, RotateCcw, ArrowRightLeft, FileSpreadsheet, ShieldCheck } from "lucide-react";
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
import { exportToCSV, getExportFileName, exportDashboardToCSV } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { filters } = useFilters();

  // Get filtered tickets and calculate KPIs
  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const kpis = useMemo(() => calculateKPIs(filteredTickets), [filteredTickets]);

  // Calculate trends (comparing to previous period - same duration but earlier)
  const previousPeriodTickets = useMemo(() => {
    const now = new Date();
    let currentPeriodStart = new Date();
    let durationInDays = 0;

    const dateRanges: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "ytd": 365,
    };

    if (filters.dateRange === "today") {
      currentPeriodStart.setHours(0, 0, 0, 0);
      durationInDays = 1;
    } else if (filters.dateRange === "mtd") {
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      durationInDays = Math.ceil((now.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    } else if (filters.dateRange === "qtd") {
      const quarter = Math.floor(now.getMonth() / 3);
      currentPeriodStart = new Date(now.getFullYear(), quarter * 3, 1);
      durationInDays = Math.ceil((now.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    } else if (filters.dateRange === "custom" && filters.customStartDate && filters.customEndDate) {
      currentPeriodStart = new Date(filters.customStartDate);
      const end = new Date(filters.customEndDate);
      durationInDays = Math.ceil((end.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      durationInDays = dateRanges[filters.dateRange] || 30;
      currentPeriodStart.setDate(now.getDate() - durationInDays);
    }

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - durationInDays);
    const previousPeriodEnd = currentPeriodStart;

    // Get all tickets with wide date range first
    let filtered = getFilteredTickets({ ...filters, dateRange: "ytd", customStartDate: undefined, customEndDate: undefined });

    return filtered.filter(t => {
      const ticketDate = new Date(t.created);
      return ticketDate >= previousPeriodStart && ticketDate < previousPeriodEnd;
    });
  }, [filters]);

  const prevKPIs = useMemo(() => calculateKPIs(previousPeriodTickets), [previousPeriodTickets]);

  const calculateTrend = (current: string | number, previous: string | number) => {
    const curr = typeof current === "string" ? parseFloat(current) : current;
    const prev = typeof previous === "string" ? parseFloat(previous) : previous;

    if (prev === 0) {
      if (curr > 0) return { value: 100, direction: "up" as const, label: "vs last period" };
      return { value: 0, direction: "neutral" as const, label: "vs last period" };
    }
    const change = ((curr - prev) / prev) * 100;
    return {
      value: parseFloat(Math.abs(change).toFixed(1)),
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "neutral" as const,
      label: "vs last period",
    };
  };

  const handleExport = (section: string) => {
    const dataToExport = filteredTickets.map(t => ({
      ID: t.ticketId,
      Title: t.title,
      Priority: t.priority,
      Status: t.status,
      "Assigned To": t.assignee,
      Group: t.assignmentGroup,
      Created: t.created,
      SLA: t.slaStatus
    }));
    exportToCSV(dataToExport, getExportFileName(section, filters.dateRange));
  };

  const handleExportDashboard = () => {
    exportDashboardToCSV({
      tickets: filteredTickets,
      kpis: kpis,
      filters: {
        priority: filters.priority,
        region: filters.region,
        assignmentGroup: filters.assignmentGroup,
        assignedTo: filters.assignedTo,
        dateRange: filters.dateRange,
      },
    });
  };

  return (
    <div className="min-h-screen bg-dashboard-bg w-full pb-10">
      <div className="w-full">
        {/* Header */}
        <div className="bg-card border-b border-border shadow-md w-full">
          <div className="w-full px-6 lg:px-10 py-5 lg:py-6">
            <DashboardHeader onExport={handleExportDashboard} />
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
                trend={calculateTrend(kpis.totalTickets, prevKPIs.totalTickets)}
                status="neutral"
                icon={<Ticket className="h-5 w-5" />}
                delay={0}
              />
              <KPICard
                title="Backlog Tickets"
                value={kpis.backlogTickets.toLocaleString()}
                trend={calculateTrend(kpis.backlogTickets, prevKPIs.backlogTickets)}
                trendIsGood={false}
                status={kpis.backlogTickets > 400 ? "high" : kpis.backlogTickets > 200 ? "moderate" : "low"}
                icon={<AlertTriangle className="h-5 w-5" />}
                delay={50}
              />
              <KPICard
                title="SLA Met %"
                value={kpis.slaMetRate}
                suffix="%"
                trend={calculateTrend(kpis.slaMetRate, prevKPIs.slaMetRate)}
                status={parseFloat(kpis.slaMetRate) < 85 ? "high" : parseFloat(kpis.slaMetRate) < 95 ? "moderate" : "low"}
                icon={<ShieldCheck className="h-5 w-5" />}
                delay={100}
              />
              <KPICard
                title="MTTR"
                value={kpis.mttr}
                suffix="hrs"
                trend={calculateTrend(kpis.mttr, prevKPIs.mttr)}
                trendIsGood={false}
                status={parseFloat(kpis.mttr) > 24 ? "high" : parseFloat(kpis.mttr) > 12 ? "moderate" : "low"}
                icon={<Clock className="h-5 w-5" />}
                delay={150}
              />
              <KPICard
                title="Re-open Rate"
                value={kpis.reopenRate}
                suffix="%"
                trend={calculateTrend(kpis.reopenRate, prevKPIs.reopenRate)}
                trendIsGood={false}
                status={parseFloat(kpis.reopenRate) > 5 ? "high" : parseFloat(kpis.reopenRate) > 3 ? "moderate" : "low"}
                icon={<RotateCcw className="h-5 w-5" />}
                delay={200}
              />
              <KPICard
                title="High-Hop Tickets"
                value={kpis.highHopTickets.toLocaleString()}
                trend={calculateTrend(kpis.highHopTickets, prevKPIs.highHopTickets)}
                trendIsGood={false}
                status={kpis.highHopTickets > 50 ? "high" : kpis.highHopTickets > 30 ? "moderate" : "low"}
                icon={<ArrowRightLeft className="h-5 w-5" />}
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
              >
                <TotalTicketsDonutChart />
              </ChartCard>
              <ChartCard
                title="MTTR Trend Over Time"
                subtitle="Mean Time to Resolve in hours"
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("MTTR")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
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
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("SLA")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
              >
                <SLATrackingChart />
              </ChartCard>
              <ChartCard
                title="SLA to be Breached"
                subtitle="Tickets at risk of SLA breach by priority"
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("SLA_Risk")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
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
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("Backlog_AssignedTo")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
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
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("Inflow")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
              >
                <TicketInflowChart />
              </ChartCard>
              <ChartCard
                title="Backlog Trend"
                subtitle="Open tickets over time"
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => handleExport("BacklogTrend")} className="h-8 text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                }
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
                subtitle="Current open tickets"
              >
                <PriorityDistributionChart />
              </ChartCard>
              <ChartCard
                title="Mean Time to Resolve by Priority"
                subtitle="Average resolution time in hours"
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
              >
                <AgeingBucketsChart />
              </ChartCard>
              <ChartCard
                title="Backlog by Assignment Group"
                subtitle="L1, L2, and L3 support levels"
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
