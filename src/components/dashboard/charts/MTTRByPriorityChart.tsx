import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { ChartLegend } from "./ChartLegend";
import { getFilteredTickets, getMTTRByPriority } from "@/data/realData";

export function MTTRByPriorityChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const data = useMemo(() => getMTTRByPriority(filteredTickets), [filteredTickets]);

  const openForPriority = (priority?: string | null) => {
    if (!priority) return;
    setSelectedPriority(priority);
    setDrillDownOpen(true);
  };

  const handleBarClick = (evt: any) => {
    openForPriority(
      evt?.activePayload?.[0]?.payload?.priority ??
        evt?.payload?.priority ??
        evt?.priority ??
        null,
    );
  };

  const drillDownData = useMemo(() => {
    if (!selectedPriority) return [];
    return filteredTickets
      .filter((t) => t.priority === selectedPriority && !!t.resolved)
      .map(t => ({
        ticketId: t.ticketId,
        title: t.title,
        resolved: t.resolved || "-",
        resolver: t.resolver || "-",
        status: t.status,
      }));
  }, [selectedPriority, filteredTickets]);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} onClick={handleBarClick}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="priority"
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
            label={{
              value: "Hours",
              angle: -90,
              position: "insideLeft",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "var(--card-shadow)",
              color: "hsl(var(--card-foreground))",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => [`${value} hours`, "MTTR"]}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Legend content={(props) => <ChartLegend {...props} />} />
          <Bar 
            name="MTTR (Hours)"
            dataKey="hours" 
            radius={[4, 4, 0, 0]} 
            barSize={48}
            onClick={(d) => openForPriority(d?.payload?.priority ?? null)}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                onClick={() => openForPriority(entry.priority)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Resolved Tickets for ${selectedPriority || ""} (Click to view details)`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "resolved", label: "Resolution Time" },
          { key: "resolver", label: "Resolver" },
          { key: "status", label: "Status" },
        ]}
      />
    </>
  );
}
