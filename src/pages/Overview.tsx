import { useMemo } from "react";
import {
    BarChart3,
    Users,
    Globe,
    Zap,
    ShieldAlert,
    TrendingUp,
    Ticket,
    AlertTriangle,
    Clock
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TotalTicketsDonutChart } from "@/components/dashboard/charts/TotalTicketsDonutChart";
import { PriorityDistributionChart } from "@/components/dashboard/charts/PriorityDistributionChart";
import { SLATrackingChart } from "@/components/dashboard/charts/SLATrackingChart";
import { getFilteredTickets, calculateKPIs, type Ticket as TicketType } from "@/data/realData";
import { useFilters } from "@/contexts/FilterContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Overview() {
    const { filters } = useFilters();
    const tickets = useMemo(() => getFilteredTickets(filters), [filters]);
    const kpis = useMemo(() => calculateKPIs(tickets), [tickets]);

    const topResolvers = useMemo(() => {
        const counts: Record<string, number> = {};
        tickets.forEach((t: TicketType) => {
            if (t.resolver) {
                counts[t.resolver] = (counts[t.resolver] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [tickets]);

    const regionalData = useMemo(() => {
        const regions: Record<string, number> = { na: 0, emea: 0, apac: 0, latam: 0, Other: 0 };
        tickets.forEach((t: TicketType) => {
            regions[t.region]++;
        });
        return Object.entries(regions).map(([region, count]) => ({
            name: region.toUpperCase(),
            value: count,
            percentage: tickets.length > 0 ? ((count / tickets.length) * 100).toFixed(1) : "0"
        }));
    }, [tickets]);

    return (
        <div className="min-h-screen bg-dashboard-bg w-full pb-10">
            <div className="w-full">
                <div className="bg-card border-b border-border shadow-md w-full">
                    <div className="w-full px-6 lg:px-10 py-5 lg:py-6">
                        <DashboardHeader />
                    </div>
                </div>

                <div className="w-full px-6 lg:px-10 py-6 lg:py-8 text-left">
                    {/* Executive Summary Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 text-primary flex-shrink-0 ring-1 ring-primary/15">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight uppercase font-heading">Strategic Overview</h2>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 font-medium">
                                Consolidated operational health, target compliance, and team performance intelligence.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 items-start">
                        {/* Column 1: Operational Vital Signs (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Vitals</h3>
                            </div>

                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
                                <KPICard
                                    title="Ticket Volume"
                                    value={kpis.totalTickets.toLocaleString()}
                                    status="neutral"
                                    icon={<Ticket className="h-5 w-5" />}
                                    delay={0}
                                />
                                <KPICard
                                    title="Compliance (SLA)"
                                    value={kpis.slaMetRate}
                                    suffix="%"
                                    status={parseFloat(kpis.slaMetRate) < 85 ? "high" : "low"}
                                    icon={<ShieldAlert className="h-5 w-5" />}
                                    delay={100}
                                />
                                <KPICard
                                    title="Resolution Efficiency"
                                    value={kpis.mttr}
                                    suffix="hrs"
                                    status={parseFloat(kpis.mttr) > 24 ? "high" : "low"}
                                    icon={<Clock className="h-5 w-5" />}
                                    delay={200}
                                />
                            </div>

                            <ChartCard
                                title="Service Quality"
                                subtitle="Open vs Closed distribution"
                                className="overflow-visible"
                            >
                                <div className="py-2">
                                    <TotalTicketsDonutChart />
                                </div>
                                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center px-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Resolution Target: 95%</span>
                                    <Link to="/dashboard" className="text-xs text-primary font-black hover:underline flex items-center gap-1">
                                        GO TO DASHBOARD <TrendingUp className="h-3 w-3" />
                                    </Link>
                                </div>
                            </ChartCard>
                        </div>

                        {/* Column 2: Service Health & Risk (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <ShieldAlert className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Health & Risk Profile</h3>
                            </div>

                            <ChartCard
                                title="SLA Trends"
                                subtitle="Performance breakdown by priority"
                                className="overflow-visible"
                            >
                                <div className="w-full">
                                    <SLATrackingChart />
                                </div>
                            </ChartCard>

                            <ChartCard
                                title="Priority Risk Pool"
                                subtitle="Backlog distribution across RAG"
                                className="overflow-visible"
                            >
                                <div className="w-full">
                                    <PriorityDistributionChart />
                                </div>
                            </ChartCard>

                            <div className="bg-card rounded-xl border border-border p-5 shadow-sm transition-all hover:shadow-md">
                                <h4 className="text-[11px] font-bold flex items-center gap-2 mb-5 uppercase tracking-widest text-muted-foreground/80">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Performance Alerts
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                                        <span className="text-xs font-bold text-foreground/70">High-Hop Rate</span>
                                        <span className="text-sm font-black text-destructive">{kpis.highHopTickets}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                                        <span className="text-xs font-bold text-foreground/70">Ticket Re-open</span>
                                        <span className="text-sm font-black text-amber-600">{kpis.reopenRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Team & Geography (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team & Geography</h3>
                            </div>

                            <ChartCard
                                title="Global Footprint"
                                subtitle="Distribution across regional units"
                                className="overflow-visible"
                            >
                                <div className="space-y-5 mt-3 px-1">
                                    {regionalData.map((item: { name: string; value: number; percentage: string }) => (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                                                <span>{item.name}</span>
                                                <span className="text-muted-foreground/60">{item.percentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-black/5">
                                                <div
                                                    className="h-full bg-primary transition-all duration-700 ease-out"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>

                            <ChartCard
                                title="Lead Resolvers"
                                subtitle="Highest resolution throughput"
                                className="overflow-visible flex flex-col h-full"
                            >
                                <div className="space-y-1.5 mt-3 flex-1">
                                    {topResolvers.map((resolver: { name: string; count: number }, idx: number) => (
                                        <div
                                            key={resolver.name}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                                                idx === 0 ? "bg-primary/5 border-primary/20" : "bg-transparent border-transparent hover:bg-muted/40"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-black",
                                                    idx === 0 ? "bg-amber-100 text-amber-700 shadow-sm" :
                                                        "bg-muted text-muted-foreground"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                <span className="text-xs font-bold text-foreground truncate">
                                                    {resolver.name}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md ml-2 flex-shrink-0">
                                                {resolver.count} PTS
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-border">
                                    <Link to="/leaderboards" className="text-[11px] text-primary font-black hover:underline flex items-center gap-2 justify-center tracking-widest">
                                        VIEW FULL LEADERBOARDS <Zap className="h-3 w-3" />
                                    </Link>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
