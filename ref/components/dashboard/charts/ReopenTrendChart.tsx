import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { getFilteredTickets } from "@/data/realData";

export function ReopenTrendChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  
  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  
  // Calculate weekly reopen rates
  const data = useMemo(() => {
    const weeks = ["W1", "W2", "W3", "W4"];
    return weeks.map((week, index) => {
      const weekTickets = filteredTickets.filter(t => {
        const ticketDate = new Date(t.created);
        const daysAgo = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= (index * 7) && daysAgo < ((index + 1) * 7);
      });
      const reopened = weekTickets.filter(t => 
        t.title.toLowerCase().includes("reopen") || 
        t.title.toLowerCase().includes("re-open")
      ).length;
      const rate = weekTickets.length > 0 ? ((reopened / weekTickets.length) * 100) : 0;
      return { week, rate: parseFloat(rate.toFixed(1)) };
    });
  }, [filteredTickets]);

  const handleDotClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedWeek(data.activePayload[0].payload.week);
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedWeek) return [];
    const weekIndex = ["W1", "W2", "W3", "W4"].indexOf(selectedWeek);
    if (weekIndex === -1) return [];
    
    return filteredTickets.filter(t => {
      const ticketDate = new Date(t.created);
      const daysAgo = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      const inWeek = daysAgo >= (weekIndex * 7) && daysAgo < ((weekIndex + 1) * 7);
      const isReopened = t.title.toLowerCase().includes("reopen") || 
                        t.title.toLowerCase().includes("re-open");
      return inWeek && isReopened;
    }).map(t => ({
      ticketId: t.ticketId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignee: t.assignee,
      created: t.created,
    }));
  }, [selectedWeek, filteredTickets]);

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis dataKey="week" hide />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}%`, "Rate"]}
        />
        <Legend />
        <Line
          name="Reopen Rate (%)"
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--priority-high))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--priority-high))", strokeWidth: 0, r: 3, cursor: "pointer" }}
          activeDot={{ r: 5, fill: "hsl(var(--priority-high))", cursor: "pointer", onClick: handleDotClick }}
          onClick={handleDotClick}
          style={{ cursor: "pointer" }}
        />
      </LineChart>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Reopened Tickets for ${selectedWeek || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
          { key: "created", label: "Created" },
        ]}
      />
    </ResponsiveContainer>
  );
}
