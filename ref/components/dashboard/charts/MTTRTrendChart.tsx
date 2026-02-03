import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { getFilteredTickets, getMTTRTrend } from "@/data/realData";
import { DrillDownModal } from "../DrillDownModal";

export function MTTRTrendChart() {
    const { filters } = useFilters();
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const data = useMemo(() => getMTTRTrend(filteredTickets, filters.dateRange), [filteredTickets, filters.dateRange]);

    const handleDotClick = (data: any, e?: any) => {
        // Handle click from tooltip/activeDot
        if (data && data.activePayload && data.activePayload[0]) {
            setSelectedDate(data.activePayload[0].payload.date);
            setDrillDownOpen(true);
        }
        // Handle click from line/dot directly
        else if (data && data.activeLabel) {
            setSelectedDate(data.activeLabel);
            setDrillDownOpen(true);
        }
        // Handle click from payload
        else if (e && e.payload && e.payload.date) {
            setSelectedDate(e.payload.date);
            setDrillDownOpen(true);
        }
    };

    const drillDownData = useMemo(() => {
        if (!selectedDate) return [];
        return filteredTickets.filter(t => {
            if (!t.resolvedAt) return false;
            const dateStr = new Date(t.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return dateStr === selectedDate;
        }).map(t => ({
            ticketId: t.ticketId,
            title: t.title,
            priority: t.priority,
            status: t.status,
            resolved: t.resolved,
            created: t.created,
        }));
    }, [selectedDate, filteredTickets]);

    return (
        <>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} onClick={handleDotClick}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            boxShadow: "var(--card-shadow)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        itemStyle={{ color: "hsl(var(--primary))" }}
                        formatter={(value: number) => [`${value} hrs`, "Avg MTTR"]}
                    />
                    <Legend />
                    <Line
                        name="Avg MTTR"
                        type="monotone"
                        dataKey="mttr"
                        stroke="hsl(var(--priority-high))"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(var(--priority-high))", strokeWidth: 0, r: 4, cursor: "pointer", onClick: handleDotClick }}
                        activeDot={{ r: 6, fill: "hsl(var(--priority-high))", cursor: "pointer", onClick: handleDotClick }}
                        onClick={handleDotClick}
                        style={{ cursor: "pointer" }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <DrillDownModal
                open={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={`Resolved Tickets on ${selectedDate || ""}`}
                data={drillDownData}
                columns={[
                    { key: "ticketId", label: "Ticket ID" },
                    { key: "title", label: "Title" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                    { key: "resolved", label: "MTTR" },
                    { key: "created", label: "Created" },
                ]}
            />
        </>
    );
}
