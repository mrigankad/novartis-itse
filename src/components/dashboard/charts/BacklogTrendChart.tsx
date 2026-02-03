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
import { ChartLegend } from "./ChartLegend";
import { getFilteredTickets, getBacklogTrend } from "@/data/realData";

export function BacklogTrendChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const chartData = useMemo(() => getBacklogTrend(filteredTickets, filters.dateRange), [filteredTickets, filters.dateRange]);

  const handleAreaClick = (evt: any) => {
    const payload = evt?.activePayload?.[0]?.payload;
    const key = payload?.fullDate ?? chartData.find((p: any) => p.date === evt?.activeLabel)?.fullDate;
    if (!key) return;

    setSelectedKey(key);
    setSelectedLabel(payload?.date ?? evt?.activeLabel ?? key);
    setDrillDownOpen(true);
  };

  const drillDownData = useMemo(() => {
    if (!selectedKey) return [];
    const keyLength = selectedKey.includes("T") ? 13 : selectedKey.length === 7 ? 7 : 10;

    return filteredTickets
      .filter((t) => {
        if (["Resolved", "Closed"].includes(t.status)) return false;
        const ticketDate = new Date(t.created.replace(" ", "T"));
        if (Number.isNaN(ticketDate.getTime())) return false;
        const key = ticketDate.toISOString().substring(0, keyLength);
        return key === selectedKey;
      })
      .map((t) => ({
        ticketId: t.ticketId,
        title: t.title,
        priority: t.priority,
        age: t.age,
        assignee: t.assignee,
      }));
  }, [selectedKey, filteredTickets]);

  return (
    <>
      {chartData.length > 0 && (
        <div className="flex justify-end mb-2">
          <span className="text-[10px] font-medium px-2 py-1 rounded border border-border bg-muted/20 text-muted-foreground">
            {chartData[0].fullDate.includes("T") ? "Hourly" : chartData[0].fullDate.length === 7 ? "Monthly" : "Daily"} view
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart 
          data={chartData} 
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
          <Legend content={(props) => <ChartLegend {...props} />} />
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
        title={`Backlog Tickets for ${selectedLabel || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "priority", label: "Priority" },
          { key: "age", label: "Age" },
          { key: "assignee", label: "Assigned To" },
        ]}
      />
    </>
  );
}
