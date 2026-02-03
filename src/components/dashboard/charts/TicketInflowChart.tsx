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
import { DrillDownModal } from "../DrillDownModal";
import { ChartLegend } from "./ChartLegend";
import { getFilteredTickets, getTicketInflowTrend } from "@/data/realData";

export function TicketInflowChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const chartData = useMemo(() => getTicketInflowTrend(filteredTickets, filters.dateRange), [filteredTickets, filters.dateRange]);

  const handleDotClick = (evt: any, e?: any) => {
    const payload = evt?.activePayload?.[0]?.payload ?? e?.payload;
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
        const ticketDate = new Date(t.created.replace(" ", "T"));
        if (Number.isNaN(ticketDate.getTime())) return false;
        const key = ticketDate.toISOString().substring(0, keyLength);
        return key === selectedKey;
      })
      .map((t) => ({
      ticketId: t.ticketId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      created: t.created,
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
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} onClick={handleDotClick}>
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
            formatter={(value: number) => [`${value} tickets`, "New Tickets"]}
          />
          <Legend content={(props) => <ChartLegend {...props} />} />
          <Line
            name="New Tickets"
            type="monotone"
            dataKey="tickets"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4, cursor: "pointer", onClick: handleDotClick }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))", cursor: "pointer", onClick: handleDotClick }}
            onClick={handleDotClick}
            style={{ cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Tickets for ${selectedLabel || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "created", label: "Created" },
        ]}
      />
    </>
  );
}
