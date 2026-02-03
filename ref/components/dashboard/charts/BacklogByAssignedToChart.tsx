import { useMemo, useState } from "react";
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
import { getFilteredTickets, getBacklogByAssignedTo } from "@/data/realData";
import { DrillDownModal } from "../DrillDownModal";

export function BacklogByAssignedToChart() {
    const { filters } = useFilters();
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

    const filteredTickets = useMemo(() => {
        // For this visual, we only care about open tickets
        return getFilteredTickets(filters).filter(t => t.status !== "Resolved" && t.status !== "Closed");
    }, [filters]);

    const data = useMemo(() => getBacklogByAssignedTo(filteredTickets), [filteredTickets]);

    const handleBarClick = (data: any, payload?: any) => {
        // Handle click from bar chart
        if (data && data.activePayload && data.activePayload[0]) {
            const assigneeName = data.activePayload[0].payload.name;
            setSelectedAssignee(assigneeName);
            setDrillDownOpen(true);
        }
        // Handle click from table row
        else if (data && data.name) {
            setSelectedAssignee(data.name);
            setDrillDownOpen(true);
        }
        // Handle direct payload
        else if (payload && payload.name) {
            setSelectedAssignee(payload.name);
            setDrillDownOpen(true);
        }
    };

    const drillDownData = useMemo(() => {
        if (!selectedAssignee) return [];
        return filteredTickets.filter(t => t.assignee === selectedAssignee).map(t => ({
            ticketId: t.ticketId,
            title: t.title,
            priority: t.priority,
            status: t.status,
            group: t.assignmentGroup,
            created: t.created,
        }));
    }, [selectedAssignee, filteredTickets]);

    return (
        <>
            <div className="space-y-6">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            onClick={handleBarClick}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={100}
                                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    boxShadow: "var(--card-shadow)",
                                }}
                            />
                            <Legend />
                            <Bar
                                name="Backlog"
                                dataKey="backlog"
                                fill="hsl(var(--primary))"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                onClick={handleBarClick}
                                style={{ cursor: "pointer" }}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index < 3 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.7)"}
                                        onClick={(e) => handleBarClick(e, entry)}
                                        style={{ cursor: "pointer" }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-2">Assigned To</th>
                                <th className="px-4 py-2">Group</th>
                                <th className="px-4 py-2 text-right">Backlog</th>
                                <th className="px-4 py-2 text-center">Aging (&lt;3d/3-7d/&gt;7d)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground">
                            {data.map((assignee, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => handleBarClick(assignee)}
                                >
                                    <td className="px-4 py-2 font-medium">{assignee.name}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{assignee.group}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-primary">{assignee.backlog}</td>
                                    <td className="px-4 py-2 text-center text-xs font-mono">{assignee.ageing}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <DrillDownModal
                open={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={`Backlog for ${selectedAssignee || ""}`}
                data={drillDownData}
                columns={[
                    { key: "ticketId", label: "Ticket ID" },
                    { key: "title", label: "Title" },
                    { key: "group", label: "Group" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                    { key: "created", label: "Created" },
                ]}
            />
        </>
    );
}
