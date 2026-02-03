import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFilters } from "@/contexts/FilterContext";
import { DrillDownModal } from "../DrillDownModal";
import { getFilteredTickets, getAgeingBuckets } from "@/data/realData";

export function AgeingBucketsChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);
  const data = useMemo(() => getAgeingBuckets(filteredTickets), [filteredTickets]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0];
      const bucket = payload.payload.bucket;
      const dataKey = payload.dataKey as string;
      const priorityMap: Record<string, string> = {
        p1: "P1",
        p2: "P2",
        p3: "P3",
        p4: "P4",
      };
      setSelectedPriority(priorityMap[dataKey] || "P1");
      setSelectedBucket(bucket);
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedBucket || !selectedPriority) return [];
    const ageRange = selectedBucket.split(" ")[0];
    const [minAge, maxAge] = ageRange.includes(">") 
      ? [31, 999] 
      : ageRange.includes("-") 
        ? ageRange.split("-").map(Number)
        : [0, 2];
    
    return filteredTickets
      .filter(t => {
        const age = parseInt(t.age.replace(" days", "").replace(" day", ""));
        return t.priority === selectedPriority && 
               (t.status === "Open" || t.status === "In Progress") &&
               age >= minAge && age <= maxAge;
      })
      .slice(0, 20)
      .map(t => ({
        ticketId: t.ticketId,
        title: t.title,
        priority: t.priority,
        age: t.age,
        status: t.status,
        assignee: t.assignee,
      }));
  }, [selectedBucket, selectedPriority, filteredTickets]);

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          onClick={handleBarClick}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="bucket"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            formatter={(value: number, name: string) => [`${value} tickets`, name]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="p1"
            name="P1"
            stackId="a"
            fill="hsl(var(--priority-critical))"
            radius={[0, 0, 0, 0]}
            style={{ cursor: "pointer" }}
          />
          <Bar
            dataKey="p2"
            name="P2"
            stackId="a"
            fill="hsl(var(--priority-high))"
            style={{ cursor: "pointer" }}
          />
          <Bar
            dataKey="p3"
            name="P3"
            stackId="a"
            fill="hsl(var(--priority-moderate))"
            style={{ cursor: "pointer" }}
          />
          <Bar
            dataKey="p4"
            name="P4"
            stackId="a"
            fill="hsl(var(--priority-low))"
            radius={[4, 4, 0, 0]}
            style={{ cursor: "pointer" }}
          />
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`Tickets in ${selectedBucket || ""} bucket - ${selectedPriority || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "age", label: "Age" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
        ]}
      />
    </>
  );
}
