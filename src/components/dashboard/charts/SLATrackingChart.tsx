import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartLegend } from "./ChartLegend";
import { getFilteredTickets, getSLATracking } from "@/data/realData";

export function SLATrackingChart() {
    const { filters } = useFilters();
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
    const [selectedSLAStatus, setSelectedSLAStatus] = useState<"met" | "breached" | null>(null);
    const [slaStatusFilter, setSlaStatusFilter] = useState<"all" | "met" | "breached">("all");
    const [drilldownSlaStatus, setDrilldownSlaStatus] = useState<"all" | "met" | "breached">("all");
    
    const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
    const data = useMemo(() => getSLATracking(filteredTickets), [filteredTickets]);

    const handleBarClick = (evt: any) => {
        const ap = evt?.activePayload?.[0];
        if (ap) {
            const priority = ap.payload?.priority;
            const dataKey = ap.dataKey as string | undefined;
            if (!priority || !dataKey) return;
            setSelectedPriority(priority);
            const status = dataKey === "met" ? "met" : "breached";
            setSelectedSLAStatus(status);
            setDrilldownSlaStatus(status);
            setDrillDownOpen(true);
            return;
        }

        const activeLabel = evt?.activeLabel;
        if (activeLabel) {
            setSelectedPriority(activeLabel);
            const status = slaStatusFilter === "all" ? "met" : slaStatusFilter;
            setSelectedSLAStatus(status);
            setDrilldownSlaStatus(status);
            setDrillDownOpen(true);
        }
    };

    const handleCardClick = (priority: string, status: "met" | "breached") => {
        setSelectedPriority(priority);
        setSelectedSLAStatus(status);
        setDrilldownSlaStatus(status);
        setDrillDownOpen(true);
    };

    const drillDownData = useMemo(() => {
        if (!selectedPriority) return [];
        return filteredTickets
            .filter(t => {
                if (t.priority !== selectedPriority) return false;
                if (drilldownSlaStatus === "all") return true;
                return t.slaStatus === drilldownSlaStatus;
            })
            .map(t => ({
                ticketId: t.ticketId,
                title: t.title,
                priority: t.priority,
                status: t.status,
                slaStatus: t.slaStatus,
                assignee: t.assignee,
                created: t.created,
            }));
    }, [selectedPriority, drilldownSlaStatus, filteredTickets]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <ToggleGroup
                    type="single"
                    value={slaStatusFilter}
                    onValueChange={(v) => setSlaStatusFilter((v as any) || "all")}
                    variant="outline"
                    size="sm"
                >
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="met">SLA Met</ToggleGroupItem>
                    <ToggleGroupItem value="breached">SLA Breached</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.map((item) => (
                    <div 
                        key={item.priority} 
                        className="bg-muted/30 rounded-lg p-3 border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleCardClick(item.priority, slaStatusFilter === "all" ? "met" : slaStatusFilter)}
                        title="Click to view tickets"
                    >
                        <div className="text-xs text-muted-foreground font-medium mb-1">
                            {item.priority} {slaStatusFilter === "breached" ? "SLA Breached" : "SLA Met"}
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            {slaStatusFilter === "breached" ? item.breached.toLocaleString() : `${item.metRate}%`}
                        </div>
                        {slaStatusFilter === "all" && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                                <span 
                                    className="hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCardClick(item.priority, "met");
                                    }}
                                >
                                    {item.met} met
                                </span>
                                {" / "}
                                <span 
                                    className="hover:text-destructive transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCardClick(item.priority, "breached");
                                    }}
                                >
                                    {item.breached} breached
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                        dataKey="priority"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--card-foreground))",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend content={(props) => <ChartLegend {...props} />} />
                    {(slaStatusFilter === "all" || slaStatusFilter === "met") && (
                        <Bar 
                            dataKey="met" 
                            name="SLA Met" 
                            stackId="a" 
                            fill="hsl(var(--priority-low))" 
                            radius={[0, 0, 0, 0]}
                            onClick={handleBarClick}
                            style={{ cursor: "pointer" }}
                        />
                    )}
                    {(slaStatusFilter === "all" || slaStatusFilter === "breached") && (
                        <Bar 
                            dataKey="breached" 
                            name="SLA Breached" 
                            stackId="a" 
                            fill="hsl(var(--priority-critical))" 
                            radius={[4, 4, 0, 0]}
                            onClick={handleBarClick}
                            style={{ cursor: "pointer" }}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
            <DrillDownModal
                open={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={`${drilldownSlaStatus === "all" ? "SLA Tickets" : drilldownSlaStatus === "met" ? "SLA Met" : "SLA Breached"} Tickets for ${selectedPriority || ""}`}
                data={drillDownData}
                headerControls={
                    <ToggleGroup
                        type="single"
                        value={drilldownSlaStatus}
                        onValueChange={(v) => setDrilldownSlaStatus((v as any) || "all")}
                        variant="outline"
                        size="sm"
                    >
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="met">SLA Met</ToggleGroupItem>
                        <ToggleGroupItem value="breached">SLA Breached</ToggleGroupItem>
                    </ToggleGroup>
                }
                columns={[
                    { key: "ticketId", label: "Ticket ID" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                    { key: "slaStatus", label: "SLA Status" },
                    { key: "assignee", label: "Assigned To" },
                    { key: "created", label: "Created" },
                ]}
            />
        </div>
    );
}
