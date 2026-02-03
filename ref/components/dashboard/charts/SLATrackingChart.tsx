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
import { getFilteredTickets, getSLATracking } from "@/data/realData";

export function SLATrackingChart() {
    const { filters } = useFilters();
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
    const [selectedSLAStatus, setSelectedSLAStatus] = useState<"met" | "breached" | null>(null);
    
    const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
    const data = useMemo(() => getSLATracking(filteredTickets), [filteredTickets]);

    const handleBarClick = (data: any, payload?: any) => {
        // Handle click from bar chart
        if (data && data.activePayload && data.activePayload[0]) {
            const payload = data.activePayload[0];
            const priority = payload.payload.priority;
            const dataKey = payload.dataKey as string;
            setSelectedPriority(priority);
            setSelectedSLAStatus(dataKey === "met" ? "met" : "breached");
            setDrillDownOpen(true);
        }
        // Handle click from chart area
        else if (data && data.activeLabel) {
            // Find the data item for this priority
            const item = data.find((d: any) => d.priority === data.activeLabel);
            if (item) {
                setSelectedPriority(item.priority);
                // Default to "met" if we can't determine from click
                setSelectedSLAStatus("met");
                setDrillDownOpen(true);
            }
        }
    };

    const handleCardClick = (priority: string, status: "met" | "breached") => {
        setSelectedPriority(priority);
        setSelectedSLAStatus(status);
        setDrillDownOpen(true);
    };

    const drillDownData = useMemo(() => {
        if (!selectedPriority || !selectedSLAStatus) return [];
        return filteredTickets
            .filter(t => t.priority === selectedPriority && t.slaStatus === selectedSLAStatus)
            .slice(0, 20)
            .map(t => ({
                ticketId: t.ticketId,
                title: t.title,
                priority: t.priority,
                status: t.status,
                slaStatus: t.slaStatus,
                assignee: t.assignee,
                created: t.created,
            }));
    }, [selectedPriority, selectedSLAStatus, filteredTickets]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.map((item) => (
                    <div 
                        key={item.priority} 
                        className="bg-muted/30 rounded-lg p-3 border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleCardClick(item.priority, "met")}
                        title="Click to view SLA Met tickets"
                    >
                        <div className="text-xs text-muted-foreground font-medium mb-1">{item.priority} SLA Met</div>
                        <div className="text-lg font-bold text-foreground">{item.metRate}%</div>
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
                    <Legend iconType="circle" />
                    <Bar 
                        dataKey="met" 
                        name="SLA Met" 
                        stackId="a" 
                        fill="hsl(var(--priority-low))" 
                        radius={[0, 0, 0, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: "pointer" }}
                    />
                    <Bar 
                        dataKey="breached" 
                        name="SLA Breached" 
                        stackId="a" 
                        fill="hsl(var(--priority-critical))" 
                        radius={[4, 4, 0, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: "pointer" }}
                    />
                </BarChart>
            </ResponsiveContainer>
            <DrillDownModal
                open={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={`${selectedSLAStatus === "met" ? "SLA Met" : "SLA Breached"} Tickets for ${selectedPriority || ""}`}
                data={drillDownData}
                columns={[
                    { key: "ticketId", label: "Ticket ID" },
                    { key: "title", label: "Title" },
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
