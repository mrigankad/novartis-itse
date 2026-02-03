import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { getFilteredTickets, getBacklogTrend } from "@/data/realData";

export function BacklogTrendChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const data = useMemo(() => getBacklogTrend(filteredTickets, filters.dateRange), [filteredTickets, filters.dateRange]);

  const handleAreaClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedDate(data.activePayload[0].payload.date);
      setDrillDownOpen(true);
    } else if (data && data.activeLabel) {
      setSelectedDate(data.activeLabel);
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTickets.filter(t => {
      const ticketDate = new Date(t.created);
      const dateStr = ticketDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return dateStr === selectedDate && (t.status === "Open" || t.status === "In Progress");
    }).map(t => ({
      ticketId: t.ticketId,
      title: t.title,
      priority: t.priority,
      age: t.age,
      assignee: t.assignee,
    }));
  }, [selectedDate, filteredTickets]);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart 
          data={data} 
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          onClick={handleAreaClick}
        >
          <defs>
            <linearGradient id="backlogGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-secondary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-secondary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
            itemStyle={{ color: "hsl(var(--chart-secondary))" }}
            formatter={(value: number) => [`${value} tickets`, "Backlog"]}
          />
          <Legend />
          <Area
            name="Backlog Trend"
            type="monotone"
            dataKey="backlog"
            stroke="hsl(var(--chart-secondary))"
            strokeWidth={2.5}
            fill="url(#backlogGradient)"
            style={{ cursor: "pointer" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Backlog Tickets for ${selectedDate || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "age", label: "Age" },
          { key: "assignee", label: "Assigned To" },
        ]}
      />
    </>
  );
}
