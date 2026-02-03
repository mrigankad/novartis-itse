import { useMemo, useState } from "react";
import { LayoutGrid, Table2, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DrillDownModal } from "@/components/dashboard/DrillDownModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/contexts/FilterContext";
import { getFilteredTickets, type Ticket } from "@/data/realData";
import { cn } from "@/lib/utils";

type LeaderboardMode = "resolver" | "assignee";
type LeaderboardView = "table" | "cards";
type SortKey = "total" | "slaMetRate" | "reopened" | "highHop" | "name";
type SortDir = "asc" | "desc";

function coerceNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isReopened(t: Ticket) {
  if (typeof t.reopenCount === "number") return t.reopenCount > 0;
  const title = String(t.title ?? "").toLowerCase();
  const status = String(t.status ?? "").toLowerCase();
  return title.includes("reopen") || title.includes("re-open") || status.includes("reopen");
}

function getInitials(name: string) {
  const cleaned = String(name ?? "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

type Tone = "good" | "warn" | "bad";

function slaTone(rate: number): Tone {
  if (rate >= 95) return "good";
  if (rate >= 85) return "warn";
  return "bad";
}

function ratioTone(numerator: number, denominator: number): Tone {
  if (denominator <= 0) return "warn";
  const pct = (numerator / denominator) * 100;
  if (pct <= 2) return "good";
  if (pct <= 8) return "warn";
  return "bad";
}

function defaultSortDir(key: SortKey): SortDir {
  return key === "name" ? "asc" : "desc";
}

export default function Leaderboards() {
  const { filters } = useFilters();
  const [mode, setMode] = useState<LeaderboardMode>("resolver");
  const [view, setView] = useState<LeaderboardView>("table");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<string | null>(null);

  const tickets = useMemo(() => getFilteredTickets({ ...filters, ticketStatus: "all" }), [filters]);

  const rows = useMemo(() => {
    const by = new Map<
      string,
      {
        name: string;
        tickets: Ticket[];
        total: number;
        reopened: number;
        highHop: number;
        slaMet: number;
      }
    >();

    for (const t of tickets) {
      const rawName = mode === "resolver" ? t.resolver : t.assignee;
      const name = (rawName && String(rawName).trim()) || "Unspecified";

      const existing = by.get(name) ?? { name, tickets: [], total: 0, reopened: 0, highHop: 0, slaMet: 0 };
      existing.tickets.push(t);
      existing.total += 1;
      if (isReopened(t)) existing.reopened += 1;
      const hops = coerceNumber(t.reassignmentCount) ?? 0;
      if (hops >= 3) existing.highHop += 1;
      if (t.slaStatus === "met") existing.slaMet += 1;
      by.set(name, existing);
    }

    const prepared = Array.from(by.values()).map((r) => {
      const slaMetRate = r.total > 0 ? (r.slaMet / r.total) * 100 : 0;
      return { ...r, slaMetRate: Number(slaMetRate.toFixed(1)) };
    });

    const direction = sortDir === "asc" ? 1 : -1;
    prepared.sort((a, b) => {
      if (sortKey === "name") {
        return direction * a.name.localeCompare(b.name);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av !== bv) return direction * (av - bv);
      return a.name.localeCompare(b.name);
    });

    return prepared;
  }, [tickets, mode, sortDir, sortKey]);

  const selectedRow = useMemo(() => {
    if (!selected) return null;
    return rows.find((r) => r.name === selected) ?? null;
  }, [rows, selected]);

  const drilldownData = useMemo(() => {
    const base = selectedRow?.tickets ?? [];
    return base.map((t) => ({
      ticketId: t.ticketId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assignee,
      resolvedBy: t.resolver ?? "",
      created: t.created,
      reopened: isReopened(t) ? "yes" : "no",
      hops: coerceNumber(t.reassignmentCount) ?? 0,
      sla: t.slaStatus,
    }));
  }, [selectedRow]);

  const modeLabel = mode === "resolver" ? "Resolved By" : "Assigned To";
  const shown = rows.slice(0, 50);

  return (
    <div className="min-h-screen bg-dashboard-bg w-full pb-10 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full relative">
        <div className="bg-card border-b border-border shadow-md w-full">
          <div className="w-full px-6 lg:px-10 py-5 lg:py-6">
            <DashboardHeader />
          </div>
        </div>

        <div className="w-full px-6 lg:px-10 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 text-primary flex-shrink-0 ring-1 ring-primary/15">
                  <Trophy className="h-5 w-5" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Leaderboards</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Ranked by ticket count within your current filters (status filter excluded). Click a row to drill into tickets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
              <Tabs value={view} onValueChange={(v) => setView(v as LeaderboardView)} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto bg-muted/60 border border-border/60">
                  <TabsTrigger value="table" className="gap-2">
                    <Table2 className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="w-full sm:w-[190px]">
                <Select value={mode} onValueChange={(v) => setMode(v as LeaderboardMode)}>
                  <SelectTrigger className="bg-card/80 backdrop-blur-sm border-border/70 hover:border-border transition-colors">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolver">Resolved By</SelectItem>
                    <SelectItem value="assignee">Assigned To</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ChartCard title={`Tickets Leaderboard (${modeLabel})`} subtitle={`${rows.length} people • ${tickets.length.toLocaleString()} tickets`}>
            {view === "table" ? (
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-md">
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className="w-[86px] bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        Rank
                      </TableHead>
                      <TableHead className="bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => {
                            if (sortKey === "name") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey("name");
                              setSortDir(defaultSortDir("name"));
                            }
                          }}
                        >
                          Name
                          {sortKey === "name" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 opacity-70" />
                            ) : (
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            )
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[120px] bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => {
                            if (sortKey === "total") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey("total");
                              setSortDir(defaultSortDir("total"));
                            }
                          }}
                        >
                          Tickets
                          {sortKey === "total" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 opacity-70" />
                            ) : (
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            )
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[120px] bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => {
                            if (sortKey === "slaMetRate") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey("slaMetRate");
                              setSortDir(defaultSortDir("slaMetRate"));
                            }
                          }}
                        >
                          SLA Met
                          {sortKey === "slaMetRate" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 opacity-70" />
                            ) : (
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            )
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[130px] bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => {
                            if (sortKey === "reopened") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey("reopened");
                              setSortDir(defaultSortDir("reopened"));
                            }
                          }}
                        >
                          Reopened
                          {sortKey === "reopened" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 opacity-70" />
                            ) : (
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            )
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right w-[150px] bg-card/90 text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => {
                            if (sortKey === "highHop") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey("highHop");
                              setSortDir(defaultSortDir("highHop"));
                            }
                          }}
                        >
                          High Hops
                          {sortKey === "highHop" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 opacity-70" />
                            ) : (
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            )
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:nth-child(even)]:bg-muted/10">
                    {shown.map((r, idx) => {
                      const rank = idx + 1;
                      const rankAttr = rank <= 3 ? String(rank) : undefined;
                      const initials = getInitials(r.name);
                      const reopenTone = ratioTone(r.reopened, r.total);
                      const hopsTone = ratioTone(r.highHop, r.total);

                      return (
                        <TableRow
                          key={r.name}
                          data-state={selected === r.name ? "selected" : undefined}
                          className={cn(
                            "group cursor-pointer border-border/60",
                            "hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-transparent",
                            "data-[state=selected]:bg-primary/10",
                            rank === 1 && "bg-[hsl(var(--leaderboard-gold)/0.04)]",
                            rank === 2 && "bg-[hsl(var(--leaderboard-silver)/0.035)]",
                            rank === 3 && "bg-[hsl(var(--leaderboard-bronze)/0.035)]",
                          )}
                          onClick={() => setSelected(r.name)}
                        >
                          <TableCell className="text-muted-foreground py-3">
                            <span className="leaderboard-rank-badge" data-rank={rankAttr}>
                              {rank}
                            </span>
                          </TableCell>

                          <TableCell className="font-medium text-foreground py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/15 flex items-center justify-center text-xs font-extrabold text-primary">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold">{r.name}</div>
                                <div className="text-xs text-muted-foreground/80 font-medium">
                                  SLA {r.slaMetRate.toFixed(1)}% • {r.reopened.toLocaleString()} reopened • {r.highHop.toLocaleString()} high hops
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-3">
                            <div className="flex justify-end">
                              <span className="leaderboard-pill bg-primary/10 text-primary border-primary/20">
                                {r.total.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-3">
                            <div className="flex justify-end">
                              <span className="leaderboard-pill" data-tone={slaTone(r.slaMetRate)}>
                                {r.slaMetRate.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-3">
                            <div className="flex justify-end">
                              <span
                                className="leaderboard-pill"
                                data-tone={reopenTone}
                                title={`${((r.reopened / Math.max(1, r.total)) * 100).toFixed(1)}% reopened`}
                              >
                                {r.reopened.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-3">
                            <div className="flex justify-end">
                              <span
                                className="leaderboard-pill"
                                data-tone={hopsTone}
                                title={`${((r.highHop / Math.max(1, r.total)) * 100).toFixed(1)}% high hops`}
                              >
                                {r.highHop.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          No tickets match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {shown.map((r, idx) => {
                  const rank = idx + 1;
                  const rankAttr = rank <= 3 ? String(rank) : undefined;
                  const initials = getInitials(r.name);
                  const reopenTone = ratioTone(r.reopened, r.total);
                  const hopsTone = ratioTone(r.highHop, r.total);
                  const slaT = slaTone(r.slaMetRate);

                  return (
                    <div
                      key={r.name}
                      className={cn(
                        "chart-container relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4",
                        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-border/80 hover:shadow-2xl cursor-pointer",
                        selected === r.name && "ring-2 ring-primary/30",
                        rank === 1 && "bg-[hsl(var(--leaderboard-gold)/0.04)]",
                        rank === 2 && "bg-[hsl(var(--leaderboard-silver)/0.03)]",
                        rank === 3 && "bg-[hsl(var(--leaderboard-bronze)/0.03)]",
                      )}
                      onClick={() => setSelected(r.name)}
                    >
                      <div className="absolute -top-16 -right-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <span className="leaderboard-rank-badge" data-rank={rankAttr}>
                            {rank}
                          </span>
                          <span className="leaderboard-pill bg-primary/10 text-primary border-primary/20">
                            {r.total.toLocaleString()} tickets
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/15 flex items-center justify-center text-xs font-extrabold text-primary flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-bold text-foreground">{r.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground/80 font-medium">
                              Click to drill into tickets
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                              SLA Met
                            </div>
                            <span className="leaderboard-pill" data-tone={slaT}>
                              {r.slaMetRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                slaT === "good" && "bg-[hsl(var(--leaderboard-good)/0.65)]",
                                slaT === "warn" && "bg-[hsl(var(--leaderboard-warn)/0.65)]",
                                slaT === "bad" && "bg-[hsl(var(--leaderboard-bad)/0.65)]",
                              )}
                              style={{ width: `${Math.max(0, Math.min(100, r.slaMetRate))}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                              <div className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                                Reopened
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-foreground">{r.reopened.toLocaleString()}</span>
                                <span className="leaderboard-pill" data-tone={reopenTone}>
                                  {((r.reopened / Math.max(1, r.total)) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                              <div className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                                High Hops
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-foreground">{r.highHop.toLocaleString()}</span>
                                <span className="leaderboard-pill" data-tone={hopsTone}>
                                  {((r.highHop / Math.max(1, r.total)) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <div className="col-span-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-10 text-center text-muted-foreground">
                    No tickets match the current filters.
                  </div>
                )}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <DrillDownModal
        open={selectedRow !== null}
        onClose={() => setSelected(null)}
        title={selectedRow ? `${modeLabel}: ${selectedRow.name}` : ""}
        data={drilldownData}
        columns={[
          { key: "ticketId", label: "Ticket ID" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignedTo", label: "Assigned To" },
          { key: "resolvedBy", label: "Resolved By" },
          { key: "hops", label: "Hops" },
          { key: "reopened", label: "Reopened" },
          { key: "sla", label: "SLA" },
          { key: "created", label: "Created" },
        ]}
      />
    </div>
  );
}
