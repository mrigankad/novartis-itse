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
import { getFilteredTickets, Ticket } from "@/data/realData";
import { ChartLegend } from "./ChartLegend";

// SLA thresholds in hours based on priority
const SLA_THRESHOLDS: Record<"P1" | "P2" | "P3" | "P4", number> = {
  P1: 4,   // 4 hours for P1
  P2: 8,   // 8 hours for P2
  P3: 24,  // 24 hours for P3
  P4: 72,  // 72 hours for P4
};

// Calculate hours from age string (e.g., "5d" -> 120 hours)
function parseAgeToHours(age: string): number {
  const days = parseInt(age.replace("d", "")) || 0;
  return days * 24;
}

// Check if ticket is at risk (within 80-90% of SLA threshold)
function isAtRisk(ticket: Ticket): boolean {
  if (ticket.status === "Resolved" || ticket.status === "Closed") {
    return false;
  }
  
  const ageHours = parseAgeToHours(ticket.age);
  const threshold = SLA_THRESHOLDS[ticket.priority];
  const riskThreshold = threshold * 0.8; // 80% of SLA threshold
  const criticalThreshold = threshold * 0.9; // 90% of SLA threshold
  
  // At risk: between 80% and 90% of threshold, not yet critical
  return ageHours >= riskThreshold && ageHours < criticalThreshold;
}

// Check if ticket is critical (within 90-100% of SLA threshold)
function isCritical(ticket: Ticket): boolean {
  if (ticket.status === "Resolved" || ticket.status === "Closed") {
    return false;
  }
  
  const ageHours = parseAgeToHours(ticket.age);
  const threshold = SLA_THRESHOLDS[ticket.priority];
  const criticalThreshold = threshold * 0.9; // 90% of SLA threshold
  
  // Critical: between 90% and 100% of threshold, not yet breached
  return ageHours >= criticalThreshold && ageHours < threshold;
}

export function SLAToBeBreachedChart() {
  const { filters } = useFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<"atRisk" | "critical" | null>(null);

  const filteredTickets = useMemo(() => getFilteredTickets(filters), [filters]);

  const data = useMemo(() => {
    const priorities: ("P1" | "P2" | "P3" | "P4")[] = ["P1", "P2", "P3", "P4"];
    const priorityMap: Record<"P1" | "P2" | "P3" | "P4", { label: string; color: string }> = {
      P1: { label: "P1 Critical", color: "hsl(var(--priority-critical))" },
      P2: { label: "P2 High", color: "hsl(var(--priority-high))" },
      P3: { label: "P3 Moderate", color: "hsl(var(--priority-moderate))" },
      P4: { label: "P4 Low", color: "hsl(var(--priority-low))" },
    };

    return priorities.map(priority => {
      const priorityTickets = filteredTickets.filter(t => t.priority === priority);
      const atRisk = priorityTickets.filter(t => isAtRisk(t) && !isCritical(t)).length;
      const critical = priorityTickets.filter(t => isCritical(t)).length;
      const total = atRisk + critical;

      return {
        priority: priorityMap[priority].label,
        priorityKey: priority,
        atRisk,
        critical,
        total,
        color: priorityMap[priority].color,
      };
    });
  }, [filteredTickets]);

  const handleBarClick = (data: any, payload?: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0];
      const priority = payload.payload.priorityKey;
      const dataKey = payload.dataKey as string;
      setSelectedPriority(priority);
      setSelectedRiskLevel(dataKey === "critical" ? "critical" : "atRisk");
      setDrillDownOpen(true);
    } else if (payload && payload.priorityKey) {
      setSelectedPriority(payload.priorityKey);
      setSelectedRiskLevel("atRisk");
      setDrillDownOpen(true);
    }
  };

  const drillDownData = useMemo(() => {
    if (!selectedPriority || !selectedRiskLevel) return [];
    
    return filteredTickets
      .filter(t => {
        if (t.priority !== selectedPriority) return false;
        if (t.status === "Resolved" || t.status === "Closed") return false;
        
        if (selectedRiskLevel === "critical") {
          return isCritical(t);
        } else {
          return isAtRisk(t) && !isCritical(t);
        }
      })
      .map(t => {
        const ageHours = parseAgeToHours(t.age);
        const threshold = SLA_THRESHOLDS[t.priority];
        const hoursRemaining = Math.max(0, threshold - ageHours);
        
        return {
          ticketId: t.ticketId,
          title: t.title,
          priority: t.priority,
          status: t.status,
          assignee: t.assignee,
          created: t.created,
          age: t.age,
          hoursRemaining: `${hoursRemaining.toFixed(1)}h`,
          riskLevel: selectedRiskLevel === "critical" ? "Critical" : "At Risk",
        };
      });
  }, [selectedPriority, selectedRiskLevel, filteredTickets]);

  const totalAtRisk = data.reduce((sum, item) => sum + item.atRisk, 0);
  const totalCritical = data.reduce((sum, item) => sum + item.critical, 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <div className="text-xs text-muted-foreground font-medium mb-1">Total At Risk</div>
          <div className="text-2xl font-bold text-foreground">{totalAtRisk + totalCritical}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {totalCritical} critical • {totalAtRisk} at risk
          </div>
        </div>
        <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
          <div className="text-xs text-destructive font-medium mb-1">Critical (90%+ SLA)</div>
          <div className="text-2xl font-bold text-destructive">{totalCritical}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Immediate attention required
          </div>
        </div>
      </div>

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
            formatter={(value: number, name: string) => [
              `${value} tickets`,
              name === "critical" ? "Critical" : "At Risk",
            ]}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Legend content={(props) => <ChartLegend {...props} />} />
          <Bar 
            dataKey="atRisk" 
            name="At Risk"
            stackId="a"
            radius={[0, 0, 0, 0]}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-atrisk-${index}`} 
                fill="hsl(var(--priority-moderate))"
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>
          <Bar 
            dataKey="critical" 
            name="Critical"
            stackId="a"
            radius={[4, 4, 0, 0]}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-critical-${index}`} 
                fill="hsl(var(--priority-critical))"
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`${selectedRiskLevel === "critical" ? "Critical" : "At Risk"} SLA Tickets for ${selectedPriority || ""}`}
        data={drillDownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assigned To" },
          { key: "created", label: "Created" },
          { key: "age", label: "Age" },
          { key: "hoursRemaining", label: "Hours Remaining" },
          { key: "riskLevel", label: "Risk Level" },
        ]}
      />
    </>
  );
}

