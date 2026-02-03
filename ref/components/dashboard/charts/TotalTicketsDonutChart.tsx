import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { getFilteredTickets } from "@/data/realData";

export function TotalTicketsDonutChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"open" | "closed" | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);

  const data = useMemo(() => {
    const openTickets = filteredTickets.filter(
      t => t.status !== "Resolved" && t.status !== "Closed"
    ).length;
    const closedTickets = filteredTickets.filter(
      t => t.status === "Resolved" || t.status === "Closed"
    ).length;

    return [
      {
        name: "Open",
        value: openTickets,
        color: "hsl(var(--priority-high))",
      },
      {
        name: "Closed",
        value: closedTickets,
        color: "hsl(var(--priority-low))",
      },
    ];
  }, [filteredTickets]);

  const handlePieClick = (data: any, index: number) => {
    if (data && data.name) {
      setSelectedStatus(data.name.toLowerCase() as "open" | "closed");
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedStatus) return [];
    
    return filteredTickets
      .filter(t => {
        if (selectedStatus === "open") {
          return t.status !== "Resolved" && t.status !== "Closed";
        } else {
          return t.status === "Resolved" || t.status === "Closed";
        }
      })
      .slice(0, 20)
      .map(t => ({
        ticketId: t.ticketId,
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignee: t.assignee,
        created: t.created,
        resolved: t.resolved || "-",
      }));
  }, [selectedStatus, filteredTickets]);

  const totalTickets = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => {
              if (value === 0) return "";
              return `${name}\n${value} (${(percent * 100).toFixed(1)}%)`;
            }}
            outerRadius={90}
            innerRadius={55}
            fill="#8884d8"
            dataKey="value"
            onClick={handlePieClick}
            style={{ cursor: "pointer" }}
            labelStyle={{
              fill: "hsl(var(--foreground))",
              fontSize: 12,
              fontWeight: 600,
              textAnchor: "middle",
            }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--card-foreground))",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => [
              `${value} tickets`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <div className="text-3xl font-bold text-foreground font-heading">
          {totalTickets.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground mt-1 font-medium">
          Total Tickets
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--priority-high))]"></div>
            <span className="text-muted-foreground">
              Open: {data[0].value.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--priority-low))]"></div>
            <span className="text-muted-foreground">
              Closed: {data[1].value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`${selectedStatus === "open" ? "Open" : "Closed"} Tickets`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
          { key: "created", label: "Created" },
          { key: "resolved", label: "Resolved" },
        ]}
      />
    </>
  );
}

