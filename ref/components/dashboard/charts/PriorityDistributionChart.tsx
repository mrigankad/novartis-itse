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
import { getFilteredTickets, getTicketsByPriority } from "@/data/realData";

export function PriorityDistributionChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const priorityData = useMemo(() => getTicketsByPriority(filteredTickets), [filteredTickets]);
  
  // Filter data based on priority filter (if not "all")
  const filteredData = useMemo(() => {
    if (filters.priority === "all") return priorityData;
    const priorityMap: Record<string, string> = {
      p1: "P1 Critical",
      p2: "P2 High",
      p3: "P3 Moderate",
      p4: "P4 Low",
    };
    return priorityData.filter(item => item.priority === priorityMap[filters.priority]);
  }, [priorityData, filters.priority]);

  const handleBarClick = (data: any, payload?: any) => {
    // Handle click from bar chart
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedPriority(data.activePayload[0].payload.priority);
      setDrillDownOpen(true);
    }
    // Handle direct payload
    else if (payload && payload.priority) {
      setSelectedPriority(payload.priority);
      setDrillDownOpen(true);
    }
    // Handle click from data object
    else if (data && data.priority) {
      setSelectedPriority(data.priority);
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedPriority) return [];
    const priorityKey = selectedPriority.split(" ")[0] as "P1" | "P2" | "P3" | "P4";
    return filteredTickets
      .filter(t => t.priority === priorityKey && (t.status === "Open" || t.status === "In Progress"))
      .slice(0, 20)
      .map(t => ({
        ticketId: t.ticketId,
        title: t.title,
        status: t.status,
        assignee: t.assignee,
        created: t.created,
      }));
  }, [selectedPriority, filteredTickets]);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={filteredData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={handleBarClick}
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
            dataKey="priority"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            width={90}
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
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            formatter={(value: number) => [`${value} tickets`, "Count"]}
          />
          <Legend />
          <Bar 
            name="Ticket Count"
            dataKey="count" 
            radius={[0, 4, 4, 0]} 
            barSize={28}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                onClick={(e) => handleBarClick(e, entry)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Tickets for ${selectedPriority || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
          { key: "created", label: "Created" },
        ]}
      />
    </>
  );
}
