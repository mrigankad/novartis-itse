import type { InfoTooltipContent } from "@/components/ui/info-tooltip";

export const dashboardTooltips = {
  kpis: {
    totalTickets: {
      what: "How many tickets match your current filters.",
      how: "This is a simple count after applying the global filters (date range, status, priority, region, group, assignee).",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
    backlogTickets: {
      what: "How many tickets are still open (work outstanding).",
      how: "Counts tickets that are not marked Resolved or Closed within the current selection.",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
    slaMetRate: {
      what: "The share of tickets that met the SLA target.",
      how: "Calculated from the tickets in your current selection and shown as a percentage.",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
    mttr: {
      what: "Average time to resolve tickets, in hours.",
      how: "Based on tickets that have a recorded resolution duration; shows the average across the current selection.",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
    reopenRate: {
      what: "The share of tickets that were reopened at least once.",
      how: "Uses the ticket's reopen count when available; falls back to a “reopen” indicator in the title/status when needed.",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
    highHopTickets: {
      what: "Tickets that were handed off multiple times (high reassignment).",
      how: "Counts tickets with 3 or more reassignments (hops) within the current selection.",
      where: "Source: ServiceNow incident dataset used by this dashboard.",
    },
  },
  charts: {
    totalTicketsOverview: {
      what: "A split of tickets into Open vs Closed/Resolved.",
      how: "Use this to quickly see whether most work is still active or already completed.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    mttrTrendOverTime: {
      what: "How resolution time is trending over time.",
      how: "Shows average resolution time grouped into time buckets based on the selected date range.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    slaTracking: {
      what: "SLA performance by priority (P1–P4).",
      how: "Compares met vs breached volumes and the met rate for each priority.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    slaToBeBreached: {
      what: "Open tickets that are close to breaching SLA.",
      how: "Highlights tickets by priority and risk level so teams can triage what needs attention first.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    backlogByAssignedTo: {
      what: "Workload distribution across assignees.",
      how: "Shows who has the most active tickets and how old that work is (age buckets).",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    ticketInflowTrend: {
      what: "New tickets created over time.",
      how: "Use it to spot spikes, seasonality, or improvements in intake volume.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    backlogTrend: {
      what: "How the open backlog is changing over time.",
      how: "Tracks the number of active (not Resolved/Closed) tickets across time buckets.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    ticketDistributionByPriority: {
      what: "How tickets are distributed across priorities (P1–P4).",
      how: "Click a bar to drill into the ticket list for that priority.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    mttrByPriority: {
      what: "Average resolution time by priority.",
      how: "Useful for validating whether higher priority tickets are being resolved faster.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    ticketAgeingBuckets: {
      what: "How long active tickets have been waiting, split by age and priority.",
      how: "Use this to identify long-running tickets and where the risk is building up.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    backlogByAssignmentGroup: {
      what: "Which assignment groups carry the most active backlog.",
      how: "Click a bar to drill into the ticket list for that group.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
  },
  quality: {
    reopenedTickets: {
      what: "How many tickets were reopened in the current selection.",
      how: "Counts tickets with a reopen count greater than zero (or a reopen indicator when the count is missing).",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    highHopTickets: {
      what: "Tickets that changed hands multiple times.",
      how: "Counts tickets with 3 or more reassignments (hops) within the current selection.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
    reopenRateTrend: {
      what: "Current reopen rate and how it moved recently.",
      how: "Trend buckets the last four weeks and shows reopen rate per week to spot improvement or regressions.",
      where: "Source: ServiceNow incident dataset after applying global filters.",
    },
  },
} satisfies {
  kpis: Record<string, InfoTooltipContent>;
  charts: Record<string, InfoTooltipContent>;
  quality: Record<string, InfoTooltipContent>;
};
