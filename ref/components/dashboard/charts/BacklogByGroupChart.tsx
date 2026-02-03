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
import { getFilteredTickets, getTicketsByGroup } from "@/data/realData";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))", // Reuse or add more specific colors if defined
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function BacklogByGroupChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const data = useMemo(() => {
    const allGroups = getTicketsByGroup(
      filteredTickets.filter(t => t.status === "Open" || t.status === "In Progress")
    );
    // Limit to top 10 groups to avoid overcrowding the chart
    return allGroups.slice(0, 10).map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [filteredTickets]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedGroup(data.activePayload[0].payload.group);
      setDrillDownOpen(true);
    } else if (data && data.payload) {
        // Handle legend click or direct bar click if payload is different
        setSelectedGroup(data.payload.group || data.value); // data.value might be the group name in legend payload
        setDrillDownOpen(true);
    }
  };
  
  // Custom legend payload
  const legendPayload = data.map((item) => ({
    id: item.group,
    type: "square" as const,
    value: item.group,
    color: item.fill,
  }));

  const drillDownData = useMemo(() => {
    if (!selectedGroup) return [];
    return filteredTickets
      .filter(t => t.assignmentGroup === selectedGroup && (t.status === "Open" || t.status === "In Progress"))
      .slice(0, 20)
      .map(t => ({
        ticketId: t.ticketId,
        title: t.title,
        priority: t.priority,
        status: t.status,
        age: t.age,
      }));
  }, [selectedGroup, filteredTickets]);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            dataKey="group"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
            width={180}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "var(--card-shadow)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            formatter={(value: number) => [`${value} tickets`, "Backlog"]}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Legend payload={legendPayload} />
          <Bar
            name="Backlog Tickets"
            dataKey="tickets"
            radius={[0, 4, 4, 0]}
            barSize={18}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Tickets for ${selectedGroup || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "age", label: "Age" },
        ]}
      />
    </>
  );
}
