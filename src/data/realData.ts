import { FilterState } from "@/contexts/FilterContext";
import incidentDataUrl from "./incident-data.json?url";
import kpiDataUrl from "./incident_kpis.json?url";
import { idbGet, idbSet } from "@/lib/idbCache";

// Re-export Ticket interface to maintain compatibility
export interface Ticket {
    ticketId: string;
    title: string;
    priority: "P1" | "P2" | "P3" | "P4";
    status: string;
    assignee: string;
    created: string;
    age: string;
    assignmentGroup: string;
    region: "na" | "emea" | "apac" | "latam" | "Other";
    businessUnit: string;
    resolved?: string; // numeric part for hours
    resolvedAt?: string; // ISO date string
    resolver?: string;
    slaStatus: "met" | "breached";
    reopenCount?: number;
    reassignmentCount?: number;
}

const INCIDENT_CACHE_KEY = "incident-data:v1";
const KPI_CACHE_KEY = "incident-kpis:v1";

// Helper functions
const mapPriority = (p: string): "P1" | "P2" | "P3" | "P4" => {
    if (!p) return "P4";
    if (p.startsWith("1")) return "P1";
    if (p.startsWith("2")) return "P2";
    if (p.startsWith("3")) return "P3";
    return "P4";
};

const extractRegion = (regionStr: string): "na" | "emea" | "apac" | "latam" | "Other" => {
    if (!regionStr) return "Other";
    const lower = regionStr.toLowerCase();
    if (lower.includes("europe")) return "emea";
    if (lower.includes("america")) return "na";
    if (lower.includes("asia") || lower.includes("apac")) return "apac";
    if (lower.includes("latam")) return "latam";
    return "Other";
};

const calculateAge = (createdStr: string, resolvedStr?: string): string => {
    const created = new Date(createdStr.replace(" ", "T"));
    const end = resolvedStr ? new Date(resolvedStr.replace(" ", "T")) : new Date();
    const diffTime = Math.abs(end.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
};

let allTickets: Ticket[] = [];
let kpiData: any = {};
let initPromise: Promise<void> | null = null;

function mapRecordToTicket(r: any): Ticket {
    const priority = mapPriority(r.Priority);
    // const groupLevel = extractGroupLevel(r["Assignment Group"]);

    // Resolve time in hours (from seconds)
    const resolvedHours = r["Resolve time"] ? (r["Resolve time"] / 3600).toFixed(1) : undefined;

    // SLA status - mocking it based on priority and resolve time as it's not in the data
    // P1 < 4h, P2 < 8h, P3 < 24h, P4 < 48h (Example rules)
    let slaStatus: "met" | "breached" = "met";
    if (resolvedHours) {
        const hours = parseFloat(resolvedHours);
        if (priority === "P1" && hours > 4) slaStatus = "breached";
        else if (priority === "P2" && hours > 8) slaStatus = "breached";
        else if (priority === "P3" && hours > 24) slaStatus = "breached";
        else if (priority === "P4" && hours > 48) slaStatus = "breached";
    }

    return {
        ticketId: r.Number,
        title: r["Short description"],
        priority,
        status: r.State,
        assignee: r["Assigned to"] || "Unassigned",
        created: r.Opened,
        age: calculateAge(r.Opened, r.Resolved),
        assignmentGroup: r["Assignment Group"] || "Unassigned",
        region: extractRegion(r.Region),
        businessUnit: r["Business Unit (Division)"] || "Other",
        resolved: resolvedHours ? `${resolvedHours} hrs` : undefined,
        resolvedAt: r.Resolved,
        resolver: r["Resolved by"],
        slaStatus,
        reopenCount: r["Reopen count"],
        reassignmentCount: r["Reassignment count"],
    };
}

function coerceNumber(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

export function getAllTickets(): Ticket[] {
    return allTickets;
}

export async function ensureRealDataLoaded() {
    if (!initPromise) {
        initPromise = (async () => {
            const cachedIncidents = await idbGet<any[]>(INCIDENT_CACHE_KEY);
            let incidents: any[] | null = cachedIncidents?.value ?? null;

            if (!incidents) {
                const response = await fetch(incidentDataUrl);
                incidents = await response.json();
                await idbSet(INCIDENT_CACHE_KEY, incidents);
            }

            const cachedKpis = await idbGet<any>(KPI_CACHE_KEY);
            let kpis: any | null = cachedKpis?.value ?? null;

            if (!kpis) {
                const response = await fetch(kpiDataUrl);
                kpis = await response.json();
                await idbSet(KPI_CACHE_KEY, kpis);
            }

            kpiData = kpis ?? {};
            allTickets = (incidents ?? []).map(mapRecordToTicket);
        })();
    }

    return initPromise;
}

export function getFilteredTickets(filters: FilterState): Ticket[] {
    let filtered = [...allTickets];

    const parseDateOnlyLocal = (value: string) => {
        const [y, m, d] = value.split("-").map((x) => parseInt(x, 10));
        return new Date(y, (m ?? 1) - 1, d ?? 1);
    };

    if (filters.priority !== "all") {
        filtered = filtered.filter(t => t.priority.toLowerCase() === filters.priority.toLowerCase());
    }

    if (filters.ticketStatus !== "all") {
        if (filters.ticketStatus === "open") {
            filtered = filtered.filter((t) => !["Resolved", "Closed"].includes(t.status));
        } else if (filters.ticketStatus === "closed") {
            filtered = filtered.filter((t) => ["Resolved", "Closed"].includes(t.status));
        }
    }

    if (filters.region !== "all") {
        filtered = filtered.filter(t => t.region === filters.region);
    }

    if (filters.assignmentGroup !== "all") {
        filtered = filtered.filter(t => t.assignmentGroup === filters.assignmentGroup);
    }

    if (filters.assignedTo !== "all") {
        filtered = filtered.filter(t => t.assignee === filters.assignedTo);
    }

    // Date Filtering - skip if "all" is selected
    if (filters.dateRange === "all") {
        return filtered;
    }

    let startDate: Date | null = null;
    let endDate: Date | null = new Date();

    const now = new Date();

    if (filters.dateRange === "today") {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    } else if (filters.dateRange === "7d") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    } else if (filters.dateRange === "15d") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
    } else if (filters.dateRange === "30d") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
    } else if (filters.dateRange === "mtd") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filters.dateRange === "qtd") {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (filters.dateRange === "custom" && filters.customStartDate && filters.customEndDate) {
        startDate = parseDateOnlyLocal(filters.customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = parseDateOnlyLocal(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
    }

    if (startDate) {
        filtered = filtered.filter(t => {
            // Handle date parsing safely
            const ticketDate = new Date(t.created.replace(" ", "T"));
            return ticketDate >= startDate! && (endDate ? ticketDate <= endDate : true);
        });
    }

    return filtered;
}

export function calculateKPIs(tickets: Ticket[]) {
    const totalTickets = tickets.length;
    // Backlog = Open, New, In Progress, etc. NOT Closed/Resolved
    const backlogTickets = tickets.filter(t => !["Resolved", "Closed"].includes(t.status)).length;

    const resolvedTickets = tickets.filter(t => t.resolved);
    const totalMttr = resolvedTickets.reduce((acc, t) => {
        const hours = parseFloat(t.resolved?.split(" ")[0] || "0");
        return acc + hours;
    }, 0);

    const mttr = resolvedTickets.length > 0 ? (totalMttr / resolvedTickets.length).toFixed(1) : "0.0";

    const reopenedTickets = tickets.filter((t) => {
        if (typeof t.reopenCount === "number") return t.reopenCount > 0;
        const title = (t.title ?? "").toLowerCase();
        const status = (t.status ?? "").toLowerCase();
        return title.includes("reopen") || title.includes("re-open") || status.includes("reopen");
    }).length;
    const reopenRate = totalTickets > 0 ? ((reopenedTickets / totalTickets) * 100).toFixed(2) : "0.0";

    const metSla = tickets.filter(t => t.slaStatus === "met").length;
    const slaMetRate = totalTickets > 0 ? ((metSla / totalTickets) * 100).toFixed(1) : "0.0";

    const highHopTickets = tickets.filter((t) => {
        const hops = coerceNumber(t.reassignmentCount) ?? 0;
        return hops >= 3;
    }).length;

    // Use values from kpiData if we are showing ALL tickets, otherwise calculated.
    // For 'highHopTickets', 'reopenRate' we might resort to defaults or approximate.

    return {
        totalTickets,
        backlogTickets,
        reopenRate,
        mttr,
        highHopTickets,
        slaMetRate
    };
}

// Chart Data Getters - largely similar to mockData but using real tickets

export function getBacklogByAssignedTo(tickets: Ticket[]) {
    const assignees: Record<string, { name: string; group: string; count: number; ageing: number[] }> = {};

    tickets.forEach(t => {
        if (!["Resolved", "Closed"].includes(t.status)) {
            if (!assignees[t.assignee]) {
                assignees[t.assignee] = { name: t.assignee, group: t.assignmentGroup, count: 0, ageing: [0, 0, 0] };
            }
            assignees[t.assignee].count++;

            const ageDays = parseInt(t.age);
            if (ageDays < 3) assignees[t.assignee].ageing[0]++;
            else if (ageDays < 7) assignees[t.assignee].ageing[1]++;
            else assignees[t.assignee].ageing[2]++;
        }
    });

    return Object.values(assignees)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(a => ({
            name: a.name,
            group: a.group,
            backlog: a.count,
            ageing: `${a.ageing[0]}/${a.ageing[1]}/${a.ageing[2]}`
        }));
}

export function getSLATracking(tickets: Ticket[]) {
    const priorities: ("P1" | "P2" | "P3" | "P4")[] = ["P1", "P2", "P3", "P4"];

    return priorities.map(p => {
        const pTickets = tickets.filter(t => t.priority === p);
        const met = pTickets.filter(t => t.slaStatus === "met").length;
        const breached = pTickets.filter(t => t.slaStatus === "breached").length;

        return {
            priority: p,
            met,
            breached,
            metRate: pTickets.length > 0 ? ((met / pTickets.length) * 100).toFixed(1) : "0.0"
        };
    });
}

export function getTicketInflowTrend(tickets: Ticket[], dateRange: string = "30d") {
    const groups: Record<string, { count: number; dateObj: Date }> = {};

    // Determine grouping strategy
    let useHourly = false;
    let useMonthly = false;
    if (dateRange === "today") {
        useHourly = true;
    } else if (dateRange === "all") {
        useMonthly = true;
    } else if (dateRange === "custom") {
        if (tickets.length > 0) {
            const dates = tickets.map(t => new Date(t.created.replace(" ", "T")).getTime()).filter(t => !isNaN(t));
            if (dates.length > 0) {
                const min = Math.min(...dates);
                const max = Math.max(...dates);
                if (max - min < 48 * 60 * 60 * 1000) { // < 48 hours
                    useHourly = true;
                }
            }
        }
    }

    tickets.forEach(t => {
        // Parse ISO-like date space separated
        const d = new Date(t.created.replace(" ", "T"));
        if (!isNaN(d.getTime())) {
            let key: string;

            if (useHourly) {
                 key = d.toISOString().substring(0, 13); // YYYY-MM-DDTHH
            } else if (useMonthly) {
                 key = d.toISOString().substring(0, 7); // YYYY-MM
            } else {
                 key = d.toISOString().substring(0, 10); // YYYY-MM-DD
            }

            if (!groups[key]) {
                const dateObj = useMonthly ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)) : d;
                groups[key] = { count: 0, dateObj };
            }
            groups[key].count++;
        }
    });

    return Object.entries(groups).map(([key, data]) => {
        let dateLabel = "";
        if (useHourly) {
             dateLabel = data.dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: "UTC" });
        } else if (useMonthly) {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
        } else {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', timeZone: "UTC" });
        }
        return {
            date: dateLabel,
            fullDate: key, // Use key for sorting
            tickets: data.count
        };
    }).sort((a, b) => a.fullDate.localeCompare(b.fullDate)); //.slice(-15); // Removed slice to show full range
}

export function getMTTRTrend(tickets: Ticket[], dateRange: string = "30d") {
    const groups: Record<string, { total: number; count: number; dateObj: Date }> = {};

    // Determine grouping strategy
    let useHourly = false;
    let useMonthly = false;
    if (dateRange === "today") {
        useHourly = true;
    } else if (dateRange === "all") {
        useMonthly = true;
    } else if (dateRange === "custom") {
        const validTickets = tickets.filter(t => t.resolvedAt);
        if (validTickets.length > 0) {
            const dates = validTickets.map(t => new Date(t.resolvedAt!.replace(" ", "T")).getTime()).filter(t => !isNaN(t));
            if (dates.length > 0) {
                const min = Math.min(...dates);
                const max = Math.max(...dates);
                if (max - min < 48 * 60 * 60 * 1000) {
                    useHourly = true;
                }
            }
        }
    }

    tickets.filter(t => t.resolvedAt).forEach(t => {
        const d = new Date(t.resolvedAt!.replace(" ", "T"));
        if (!isNaN(d.getTime())) {
            let key: string;

            if (useHourly) {
                 key = d.toISOString().substring(0, 13);
            } else if (useMonthly) {
                 key = d.toISOString().substring(0, 7);
            } else {
                 key = d.toISOString().substring(0, 10);
            }

            const hours = parseFloat(t.resolved?.split(" ")[0] || "0");

            if (!groups[key]) {
                const dateObj = useMonthly ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)) : d;
                groups[key] = { total: 0, count: 0, dateObj };
            }
            groups[key].total += hours;
            groups[key].count += 1;
        }
    });

    return Object.entries(groups).map(([key, data]) => {
        let dateLabel = "";
        if (useHourly) {
             dateLabel = data.dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: "UTC" });
        } else if (useMonthly) {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
        } else {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', timeZone: "UTC" });
        }
        
        return {
            date: dateLabel,
            fullDate: key,
            mttr: parseFloat((data.total / data.count).toFixed(1))
        };
    }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
}

export function getBacklogTrend(tickets: Ticket[], dateRange: string = "30d") {
    const groups: Record<string, { count: number; dateObj: Date }> = {};

    // Determine grouping strategy
    let useHourly = false;
    let useMonthly = false;
    if (dateRange === "today") {
        useHourly = true;
    } else if (dateRange === "all") {
        useMonthly = true;
    } else if (dateRange === "custom") {
        const validTickets = tickets.filter(t => !["Resolved", "Closed"].includes(t.status));
        if (validTickets.length > 0) {
            const dates = validTickets.map(t => new Date(t.created.replace(" ", "T")).getTime()).filter(t => !isNaN(t));
            if (dates.length > 0) {
                const min = Math.min(...dates);
                const max = Math.max(...dates);
                if (max - min < 48 * 60 * 60 * 1000) {
                    useHourly = true;
                }
            }
        }
    }

    tickets.forEach(t => {
        if (!["Resolved", "Closed"].includes(t.status)) {
            const d = new Date(t.created.replace(" ", "T"));
            if (!isNaN(d.getTime())) {
                let key: string;

                if (useHourly) {
                     key = d.toISOString().substring(0, 13);
                } else if (useMonthly) {
                     key = d.toISOString().substring(0, 7);
                } else {
                     key = d.toISOString().substring(0, 10);
                }

                if (!groups[key]) {
                    const dateObj = useMonthly ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)) : d;
                    groups[key] = { count: 0, dateObj };
                }
                groups[key].count++;
            }
        }
    });

    return Object.entries(groups).map(([key, data]) => {
         let dateLabel = "";
        if (useHourly) {
             dateLabel = data.dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: "UTC" });
        } else if (useMonthly) {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
        } else {
             dateLabel = data.dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', timeZone: "UTC" });
        }

        return {
            date: dateLabel,
            fullDate: key,
            backlog: data.count
        };
    }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
}

export function getTicketsByPriority(tickets: Ticket[]) {
    const priorityMap: Record<"P1" | "P2" | "P3" | "P4", { label: string; color: string }> = {
        P1: { label: "P1 Critical", color: "#E74A21" },
        P2: { label: "P2 High", color: "#E74A21" },
        P3: { label: "P3 Moderate", color: "#EC9A1E" },
        P4: { label: "P4 Low", color: "#0460A9" },
    };

    const priorities: ("P1" | "P2" | "P3" | "P4")[] = ["P1", "P2", "P3", "P4"];

    return priorities.map(p => {
        const count = tickets.filter(t => t.priority === p).length;
        return {
            priority: priorityMap[p].label,
            count,
            color: priorityMap[p].color,
        };
    });
}

export function getMTTRByPriority(tickets: Ticket[]) {
    const priorityMap: Record<"P1" | "P2" | "P3" | "P4", { color: string }> = {
        P1: { color: "#E74A21" },
        P2: { color: "#E74A21" },
        P3: { color: "#EC9A1E" },
        P4: { color: "#0460A9" },
    };

    const priorities: ("P1" | "P2" | "P3" | "P4")[] = ["P1", "P2", "P3", "P4"];

    return priorities.map(p => {
        const resolvedTickets = tickets.filter(t => t.priority === p && t.resolved);
        const totalHours = resolvedTickets.reduce((acc, t) => {
            const hours = parseFloat(t.resolved?.split(" ")[0] || "0");
            return acc + hours;
        }, 0);
        const avgHours = resolvedTickets.length > 0 ? totalHours / resolvedTickets.length : 0;

        return {
            priority: p,
            hours: parseFloat(avgHours.toFixed(1)),
            color: priorityMap[p].color,
        };
    });
}

export function getTicketsByGroup(tickets: Ticket[]) {
    const groups: Record<string, number> = {};

    tickets.forEach(t => {
        if (t.assignmentGroup) {
            groups[t.assignmentGroup] = (groups[t.assignmentGroup] || 0) + 1;
        }
    });

    return Object.entries(groups).map(([group, count]) => ({
        group,
        tickets: count,
    })).sort((a, b) => b.tickets - a.tickets);
}

export function getAgeingBuckets(tickets: Ticket[]) {
    const buckets = ["0-2 days", "3-7 days", "8-15 days", "16-30 days", ">30 days"];

    return buckets.map(bucket => {
        const result: { bucket: string; p1: number; p2: number; p3: number; p4: number } = {
            bucket,
            p1: 0,
            p2: 0,
            p3: 0,
            p4: 0,
        };

        tickets.forEach(t => {
            if (["Resolved", "Closed"].includes(t.status)) return;

            const ageDays = parseInt(t.age) || 0;
            let inBucket = false;

            if (bucket === "0-2 days") {
                inBucket = ageDays >= 0 && ageDays <= 2;
            } else if (bucket === "3-7 days") {
                inBucket = ageDays >= 3 && ageDays <= 7;
            } else if (bucket === "8-15 days") {
                inBucket = ageDays >= 8 && ageDays <= 15;
            } else if (bucket === "16-30 days") {
                inBucket = ageDays >= 16 && ageDays <= 30;
            } else if (bucket === ">30 days") {
                inBucket = ageDays > 30;
            }

            if (inBucket) {
                const priorityKey = t.priority.toLowerCase() as "p1" | "p2" | "p3" | "p4";
                result[priorityKey]++;
            }
        });

        return result;
    });
}
