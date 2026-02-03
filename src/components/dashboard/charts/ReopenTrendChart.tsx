import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { getFilteredTickets } from "@/data/realData";
import { ChartLegend } from "./ChartLegend";

export function ReopenTrendChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  
  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);

  const isReopened = (t: any) => {
    if (typeof t?.reopenCount === "number") return t.reopenCount > 0;
    const title = String(t?.title ?? "").toLowerCase();
    const status = String(t?.status ?? "").toLowerCase();
    return title.includes("reopen") || title.includes("re-open") || status.includes("reopen");
  };
  
  // Calculate weekly reopen rates
  const data = useMemo(() => {
    const weeks = ["W1", "W2", "W3", "W4"];
    return weeks.map((week, index) => {
      const weekTickets = filteredTickets.filter(t => {
        const ticketDate = new Date(t.created.replace(" ", "T"));
        if (Number.isNaN(ticketDate.getTime())) return false;
        const daysAgo = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= (index * 7) && daysAgo < ((index + 1) * 7);
      });
      const reopened = weekTickets.filter(isReopened).length;
      const rate = weekTickets.length > 0 ? ((reopened / weekTickets.length) * 100) : 0;
      return { week, rate: parseFloat(rate.toFixed(1)) };
    });
  }, [filteredTickets]);

  const handlePointClick = (evt: any, e?: any) => {
    const payload = evt?.activePayload?.[0]?.payload ?? e?.payload;
    const week = payload?.week ?? evt?.payload?.week;
    if (!week) return;
    setSelectedWeek(week);
    setDrillDownOpen(true);
  };

  const drillDownData = useMemo(() => {
    if (!selectedWeek) return [];
    const weekIndex = ["W1", "W2", "W3", "W4"].indexOf(selectedWeek);
    if (weekIndex === -1) return [];
    
    return filteredTickets.filter(t => {
      const ticketDate = new Date(t.created.replace(" ", "T"));
      if (Number.isNaN(ticketDate.getTime())) return false;
      const daysAgo = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      const inWeek = daysAgo >= (weekIndex * 7) && daysAgo < ((weekIndex + 1) * 7);
      return inWeek && isReopened(t);
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
    <>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} onClick={handlePointClick}>
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
          <Legend content={(props) => <ChartLegend {...props} />} />
          <Line
            name="Reopen Rate (%)"
            type="monotone"
            dataKey="rate"
            stroke="hsl(var(--priority-high))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--priority-high))", strokeWidth: 0, r: 3, cursor: "pointer", onClick: handlePointClick }}
            activeDot={{ r: 5, fill: "hsl(var(--priority-high))", cursor: "pointer", onClick: handlePointClick }}
            onClick={handlePointClick}
            style={{ cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Reopened Tickets for ${selectedWeek || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
          { key: "created", label: "Created" },
        ]}
      />
    </>
  );
}
