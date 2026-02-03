import { Ticket } from "@/data/realData";

export const exportToCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            const escaped = ('' + value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const getExportFileName = (section: string, dateRange: string) => {
    const date = new Date().toISOString().split("T")[0];
    return `Novartis_ITSE_${section}_${dateRange}_${date}`;
};

export interface DashboardExportData {
    tickets: Ticket[];
    kpis: {
        totalTickets: number;
        backlogTickets: number;
        reopenRate: string;
        mttr: string;
        highHopTickets: number;
        slaMetRate: string;
    };
    filters: {
        priority: string;
        region: string;
        assignmentGroup: string;
        assignedTo: string;
        dateRange: string;
    };
}

export const exportDashboardToCSV = (data: DashboardExportData) => {
    const date = new Date().toISOString().split("T")[0];
    const fileName = `Novartis_ITSE_Dashboard_Export_${date}`;

    // Create comprehensive export data
    const exportData: any[] = [];

    // Add summary section
    exportData.push({ Section: "=== DASHBOARD SUMMARY ===", Value: "", Details: "" });
    exportData.push({ Section: "Export Date", Value: new Date().toLocaleString(), Details: "" });
    exportData.push({ Section: "Date Range Filter", Value: data.filters.dateRange, Details: "" });
    exportData.push({ Section: "Priority Filter", Value: data.filters.priority, Details: "" });
    exportData.push({ Section: "Region Filter", Value: data.filters.region, Details: "" });
    exportData.push({ Section: "Assignment Group Filter", Value: data.filters.assignmentGroup, Details: "" });
    exportData.push({ Section: "Assigned To Filter", Value: data.filters.assignedTo, Details: "" });
    exportData.push({ Section: "", Value: "", Details: "" });

    // Add KPI section
    exportData.push({ Section: "=== KEY PERFORMANCE INDICATORS ===", Value: "", Details: "" });
    exportData.push({ Section: "Total Tickets", Value: data.kpis.totalTickets.toString(), Details: "" });
    exportData.push({ Section: "Backlog Tickets", Value: data.kpis.backlogTickets.toString(), Details: "" });
    exportData.push({ Section: "Reopen Rate", Value: `${data.kpis.reopenRate}%`, Details: "" });
    exportData.push({ Section: "Mean Time To Resolution (MTTR)", Value: `${data.kpis.mttr} hours`, Details: "" });
    exportData.push({ Section: "High-Hop Tickets (≥3)", Value: data.kpis.highHopTickets.toString(), Details: "" });
    exportData.push({ Section: "SLA Met Rate", Value: `${data.kpis.slaMetRate}%`, Details: "" });
    exportData.push({ Section: "", Value: "", Details: "" });

    // Add tickets section
    exportData.push({ Section: "=== TICKET DETAILS ===", Value: "", Details: "" });
    exportData.push({
        Section: "Ticket ID",
        Value: "Title",
        Details: "Priority | Status | Assigned To | Group | Region | Business Unit | Created | Age | SLA Status | Resolved"
    });

    // Add all ticket data
    data.tickets.forEach(ticket => {
        exportData.push({
            Section: ticket.ticketId,
            Value: ticket.title,
            Details: `${ticket.priority} | ${ticket.status} | ${ticket.assignee} | ${ticket.assignmentGroup} | ${ticket.region.toUpperCase()} | ${ticket.businessUnit} | ${ticket.created} | ${ticket.age} | ${ticket.slaStatus} | ${ticket.resolved || "N/A"}`
        });
    });

    // Convert to CSV format
    const csvRows = [];
    csvRows.push("Section,Value,Details");

    for (const row of exportData) {
        const values = [
            (row.Section || "").replace(/"/g, '""'),
            (row.Value || "").replace(/"/g, '""'),
            (row.Details || "").replace(/"/g, '""')
        ];
        csvRows.push(`"${values.join('","')}"`);
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};