import type { FilterState } from "@/contexts/FilterContext";
import { calculateKPIs, getFilteredTickets, getSLATracking } from "@/data/realData";
import LogoUrl from "@/assets/Logo.svg";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function formatDateStamp(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}-${hh}${mm}`;
}

function formatFilterSummary(filters: FilterState) {
  const dateRange =
    filters.dateRange === "custom"
      ? `Custom (${filters.customStartDate ?? ""} → ${filters.customEndDate ?? ""})`
      : filters.dateRange;

  return [
    ["Date Range", dateRange],
    ["Ticket Status", filters.ticketStatus],
    ["Priority", filters.priority],
    ["Region", filters.region],
    ["Assignment Group", filters.assignmentGroup],
    ["Assigned To", filters.assignedTo],
  ];
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function toFixedOrBlank(value: unknown, digits: number) {
  const n = asNumber(value);
  if (n === null) return "";
  return n.toFixed(digits);
}

async function svgUrlToPngDataUrl(svgUrl: string, targetWidthPx: number) {
  const svgText = await (await fetch(svgUrl)).text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;
    await img.decode();

    const scale = targetWidthPx / img.width;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function exportDashboardToExcel(filters: FilterState) {
  const tickets = getFilteredTickets(filters);
  const kpis = calculateKPIs(tickets);
  const slaByPriority = getSLATracking(tickets);

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Novartis ITSE Dashboard";
  workbook.created = new Date();
  workbook.modified = new Date();

  const titleFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0460A9" } } as const;
  const sectionFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FB" } } as const;
  const zebraFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } } as const;
  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  } as const;

  const priorityCellStyle: Record<
    string,
    { fill: { type: "pattern"; pattern: "solid"; fgColor: { argb: string } }; font: { color: { argb: string }; bold: boolean } }
  > = {
    P1: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }, font: { color: { argb: "FFB91C1C" }, bold: true } },
    P2: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } }, font: { color: { argb: "FF9A3412" }, bold: true } },
    P3: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }, font: { color: { argb: "FFB45309" }, bold: true } },
    P4: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }, font: { color: { argb: "FF15803D" }, bold: true } },
  };

  const slaCellStyle: Record<string, { fill: { type: "pattern"; pattern: "solid"; fgColor: { argb: string } }; font: { color: { argb: string }; bold: boolean } }> =
    {
      met: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }, font: { color: { argb: "FF166534" }, bold: true } },
      breached: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }, font: { color: { argb: "FFB91C1C" }, bold: true } },
    };

  const statusCellStyle: Record<string, { fill: { type: "pattern"; pattern: "solid"; fgColor: { argb: string } }; font: { color: { argb: string }; bold: boolean } }> =
    {
      open: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } }, font: { color: { argb: "FF9A3412" }, bold: true } },
      resolved: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }, font: { color: { argb: "FF166534" }, bold: true } },
    };

  const overview = workbook.addWorksheet("Overview", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
  });
  overview.columns = [
    { key: "a", width: 26 },
    { key: "b", width: 54 },
    { key: "c", width: 18 },
    { key: "d", width: 18 },
  ];

  overview.mergeCells("A1:D1");
  overview.getCell("A1").value = "Novartis ITSE Dashboard Report";
  overview.getCell("A1").fill = titleFill;
  overview.getCell("A1").font = { color: { argb: "FFFFFFFF" }, bold: true, size: 16 };
  overview.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  overview.getRow(1).height = 28;

  overview.mergeCells("A2:D2");
  overview.getCell("A2").value = `Generated: ${new Date().toLocaleString()}  •  Tickets: ${tickets.length.toLocaleString()}`;
  overview.getCell("A2").font = { color: { argb: "FF374151" }, size: 11 };
  overview.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };
  overview.getRow(2).height = 20;

  let row = 4;
  const addSectionTitle = (text: string) => {
    overview.mergeCells(`A${row}:D${row}`);
    const cell = overview.getCell(`A${row}`);
    cell.value = text;
    cell.fill = sectionFill;
    cell.font = { bold: true, color: { argb: "FF111827" }, size: 12 };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    overview.getRow(row).height = 18;
    row += 1;
  };

  const addKeyValueRows = (pairs: Array<[string, string]>) => {
    for (const [k, v] of pairs) {
      overview.getCell(`A${row}`).value = k;
      overview.getCell(`B${row}`).value = v;
      for (const addr of [`A${row}`, `B${row}`]) {
        const cell = overview.getCell(addr);
        cell.border = thinBorder;
        cell.font = { size: 11, color: { argb: "FF111827" } };
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      }
      overview.getRow(row).height = 18;
      row += 1;
    }
    row += 1;
  };

  addSectionTitle("Filters");
  addKeyValueRows(formatFilterSummary(filters).map(([k, v]) => [k, String(v)]));

  addSectionTitle("KPIs");
  addKeyValueRows([
    ["Total Tickets", String(kpis.totalTickets.toLocaleString())],
    ["Backlog Tickets", String(kpis.backlogTickets.toLocaleString())],
    ["SLA Met %", `${kpis.slaMetRate}%`],
    ["MTTR (hrs)", String(kpis.mttr)],
    ["Re-open Rate %", `${kpis.reopenRate}%`],
    ["High-Hop Tickets", String(kpis.highHopTickets.toLocaleString())],
  ]);

  addSectionTitle("SLA by Priority");
  overview.getCell(`A${row}`).value = "Priority";
  overview.getCell(`B${row}`).value = "Met";
  overview.getCell(`C${row}`).value = "Breached";
  overview.getCell(`D${row}`).value = "Met %";
  for (const addr of [`A${row}`, `B${row}`, `C${row}`, `D${row}`]) {
    const cell = overview.getCell(addr);
    cell.fill = sectionFill;
    cell.font = { bold: true, size: 11, color: { argb: "FF111827" } };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: "left" };
  }
  overview.getRow(row).height = 18;
  row += 1;
  for (const item of slaByPriority) {
    overview.getCell(`A${row}`).value = item.priority;
    overview.getCell(`B${row}`).value = item.met;
    overview.getCell(`C${row}`).value = item.breached;
    overview.getCell(`D${row}`).value = toFixedOrBlank(item.metRate, 1);
    for (const addr of [`A${row}`, `B${row}`, `C${row}`, `D${row}`]) {
      const cell = overview.getCell(addr);
      cell.border = thinBorder;
      cell.font = { size: 11, color: { argb: "FF111827" } };
      cell.alignment = { vertical: "top", horizontal: "left" };
    }
    const pStyle = priorityCellStyle[String(item.priority ?? "").trim()];
    if (pStyle) {
      const pCell = overview.getCell(`A${row}`);
      pCell.fill = pStyle.fill;
      pCell.font = { ...pCell.font, ...pStyle.font };
      pCell.alignment = { vertical: "middle", horizontal: "left" };
    }
    overview.getRow(row).height = 18;
    row += 1;
  }

  const ticketsSheet = workbook.addWorksheet("Tickets", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  ticketsSheet.columns = [
    { header: "Ticket ID", key: "ticketId", width: 14 },
    { header: "Title", key: "title", width: 60 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Status", key: "status", width: 14 },
    { header: "Assignee", key: "assignee", width: 18 },
    { header: "Assignment Group", key: "assignmentGroup", width: 22 },
    { header: "Region", key: "region", width: 10 },
    { header: "Created", key: "created", width: 20 },
    { header: "Resolved At", key: "resolvedAt", width: 20 },
    { header: "MTTR (hrs)", key: "mttr", width: 12 },
    { header: "SLA Status", key: "slaStatus", width: 12 },
  ];

  const headerRow = ticketsSheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = titleFill;
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = thinBorder;
  });
  ticketsSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ticketsSheet.columns.length },
  };

  for (const t of tickets) {
    const mttrHours = t.resolved ? asNumber(t.resolved.split(" ")[0]) : null;
    ticketsSheet.addRow({
      ticketId: t.ticketId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignee: t.assignee,
      assignmentGroup: t.assignmentGroup,
      region: t.region,
      created: t.created,
      resolvedAt: t.resolvedAt ?? "",
      mttr: mttrHours ?? "",
      slaStatus: t.slaStatus,
    });
  }

  ticketsSheet.eachRow((r, rowNumber) => {
    if (rowNumber === 1) return;
    r.height = 18;
    const resolvedAt = String(r.getCell(9).value ?? "").trim();
    const rowIsOpen = resolvedAt.length === 0;
    r.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { size: 11, color: { argb: "FF111827" } };
      cell.alignment =
        colNumber === 2
          ? { vertical: "top", horizontal: "left", wrapText: true }
          : { vertical: "top", horizontal: "left" };
      if (rowNumber % 2 === 0) cell.fill = zebraFill;
    });

    const priorityValue = String(r.getCell(3).value ?? "").trim();
    const priorityStyle = priorityCellStyle[priorityValue];
    if (priorityStyle) {
      const c = r.getCell(3);
      c.fill = priorityStyle.fill;
      c.font = { ...c.font, ...priorityStyle.font };
      c.alignment = { vertical: "middle", horizontal: "center" };
    }

    const statusCell = r.getCell(4);
    const normalizedStatus = String(statusCell.value ?? "").toLowerCase();
    const statusLooksResolved =
      !rowIsOpen || normalizedStatus.includes("resolved") || normalizedStatus.includes("closed");
    const statusStyle = statusLooksResolved ? statusCellStyle.resolved : statusCellStyle.open;
    statusCell.fill = statusStyle.fill;
    statusCell.font = { ...statusCell.font, ...statusStyle.font };
    statusCell.alignment = { vertical: "middle", horizontal: "left" };

    const slaValue = String(r.getCell(11).value ?? "").trim().toLowerCase();
    const slaStyle = slaCellStyle[slaValue];
    if (slaStyle) {
      const c = r.getCell(11);
      c.fill = slaStyle.fill;
      c.font = { ...c.font, ...slaStyle.font };
      c.alignment = { vertical: "middle", horizontal: "center" };
    }

    const mttrCell = r.getCell(10);
    if (typeof mttrCell.value === "number") {
      mttrCell.numFmt = "0.0";
      mttrCell.alignment = { vertical: "middle", horizontal: "right" };
    }
  });

  const fileBase = safeFilename(`dashboard-${formatDateStamp()}`);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, `${fileBase}.xlsx`);
}

async function exportDashboardSummaryToPdf(filters: FilterState) {
  const tickets = getFilteredTickets(filters);
  const kpis = calculateKPIs(tickets);

  const slaByPriority = getSLATracking(tickets);

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 48;
  const headerHeight = 60;
  const footerHeight = 34;
  const contentTop = headerHeight + 16;
  const contentBottom = footerHeight + 16;

  const logoPng = await svgUrlToPngDataUrl(LogoUrl, 42).catch(() => null);

  const primary = { r: 4, g: 96, b: 169 };
  const primaryDark = { r: 3, g: 74, b: 130 };
  const accent = { r: 231, g: 74, b: 33 };
  const sectionBg = { r: 243, g: 247, b: 252 };
  const textDark = { r: 17, g: 24, b: 39 };
  const textMuted = { r: 107, g: 114, b: 128 };

  const priorityFill: Record<string, [number, number, number]> = {
    P1: [185, 28, 28],
    P2: [234, 88, 12],
    P3: [236, 154, 30],
    P4: [22, 163, 74],
  };

  const title = "Novartis ITSE Dashboard Report";
  const subtitle = `Generated: ${new Date().toLocaleString()}   •   Tickets: ${tickets.length.toLocaleString()}`;

  const getCurrentPageNumber = () => {
    const info = (pdf as any).internal?.getCurrentPageInfo?.();
    if (info?.pageNumber) return info.pageNumber as number;
    const fn = (pdf as any).getNumberOfPages;
    if (typeof fn === "function") return fn.call(pdf) as number;
    return 1;
  };

  const drawHeaderFooter = (pageNumber: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");
    pdf.setFillColor(primary.r, primary.g, primary.b);
    pdf.rect(0, headerHeight - 4, pageWidth, 4, "F");

    const titleX = logoPng ? marginX + 46 : marginX;
    if (logoPng) {
      pdf.addImage(logoPng, "PNG", marginX, 10, 32, 40);
    }

    pdf.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
    pdf.setFontSize(14);
    pdf.text(title, titleX, 28);
    pdf.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    pdf.setFontSize(9);
    pdf.text(subtitle, titleX, 44);

    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(1);
    pdf.line(marginX, pageHeight - footerHeight, pageWidth - marginX, pageHeight - footerHeight);
    pdf.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    pdf.setFontSize(9);
    pdf.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 12, { align: "right" });
  };

  const ensureSpace = (y: number, minRemaining: number) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + minRemaining <= pageHeight - contentBottom) return y;
    pdf.addPage();
    drawHeaderFooter(getCurrentPageNumber());
    return contentTop;
  };

  const addSectionTitle = (y: number, label: string) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const availableWidth = pageWidth - marginX * 2;
    const h = 22;
    pdf.setFillColor(sectionBg.r, sectionBg.g, sectionBg.b);
    pdf.roundedRect(marginX, y, availableWidth, h, 6, 6, "F");
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(marginX, y, 6, h, "F");
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);
    pdf.setFontSize(11);
    pdf.text(label, marginX + 14, y + 15);
    return y + h + 10;
  };

  const filtersTable = formatFilterSummary(filters).map(([k, v]) => [k, String(v)]);
  const kpiTable = [
    ["Total Tickets", kpis.totalTickets.toLocaleString()],
    ["Backlog Tickets", kpis.backlogTickets.toLocaleString()],
    ["SLA Met %", `${kpis.slaMetRate}%`],
    ["MTTR (hrs)", String(kpis.mttr)],
    ["Re-open Rate %", `${kpis.reopenRate}%`],
    ["High-Hop Tickets", kpis.highHopTickets.toLocaleString()],
  ];
  const slaTable = slaByPriority.map((p) => [p.priority, String(p.met), String(p.breached), `${p.metRate}%`]);
  const topTickets = tickets.slice(0, 100).map((t) => [
    t.ticketId,
    t.title,
    t.priority,
    t.status,
    t.assignee,
    t.created,
    t.slaStatus,
  ]);

  drawHeaderFooter(1);

  let cursorY = contentTop;
  cursorY = ensureSpace(cursorY, 60);
  cursorY = addSectionTitle(cursorY, "Filters");
  autoTable(pdf, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: contentTop, bottom: contentBottom },
    head: [["Filter", "Value"]],
    body: filtersTable,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [primaryDark.r, primaryDark.g, primaryDark.b], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: "auto" } },
    didDrawPage: (data) => drawHeaderFooter(data.pageNumber),
  });

  cursorY = (pdf as any).lastAutoTable.finalY + 14;
  cursorY = ensureSpace(cursorY, 60);
  cursorY = addSectionTitle(cursorY, "KPI Summary");
  autoTable(pdf, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: contentTop, bottom: contentBottom },
    head: [["KPI", "Value"]],
    body: kpiTable,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [primaryDark.r, primaryDark.g, primaryDark.b], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: "auto" } },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index !== 1) return;
      const label = String((data.row.raw as any)?.[0] ?? "");
      if (label === "SLA Met %") {
        const v = asNumber(String(data.cell.raw).replace("%", ""));
        if (v !== null) {
          if (v >= 95) {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [6, 95, 70];
          } else if (v >= 85) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          } else {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
          }
        }
      }
    },
    didDrawPage: (data) => drawHeaderFooter(data.pageNumber),
  });

  cursorY = (pdf as any).lastAutoTable.finalY + 14;
  cursorY = ensureSpace(cursorY, 80);
  cursorY = addSectionTitle(cursorY, "SLA By Priority");
  autoTable(pdf, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: contentTop, bottom: contentBottom },
    head: [["Priority", "Met", "Breached", "Met %"]],
    body: slaTable,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [primaryDark.r, primaryDark.g, primaryDark.b], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 0: { cellWidth: 90 } },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 0) {
        const p = String(data.cell.raw ?? "");
        const fill = priorityFill[p];
        if (fill) {
          data.cell.styles.fillColor = fill;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.column.index === 3) {
        const v = asNumber(String(data.cell.raw).replace("%", ""));
        if (v !== null) {
          if (v >= 95) {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [6, 95, 70];
          } else if (v >= 85) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          } else {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
          }
        }
      }
    },
    didDrawPage: (data) => drawHeaderFooter(data.pageNumber),
  });

  pdf.addPage("a4", "landscape");
  const landscapeAvailableWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
  drawHeaderFooter(getCurrentPageNumber());

  const fixedWidths = {
    ticketId: 74,
    priority: 46,
    status: 76,
    assignee: 110,
    created: 110,
    sla: 56,
  } as const;
  const titleWidth = Math.max(
    200,
    landscapeAvailableWidth -
      (fixedWidths.ticketId + fixedWidths.priority + fixedWidths.status + fixedWidths.assignee + fixedWidths.created + fixedWidths.sla),
  );

  cursorY = contentTop;
  cursorY = ensureSpace(cursorY, 80);
  cursorY = addSectionTitle(cursorY, "Top Tickets (First 100)");
  autoTable(pdf, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: contentTop, bottom: contentBottom },
    head: [["Ticket ID", "Title", "Priority", "Status", "Assignee", "Created", "SLA"]],
    body: topTickets,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [primaryDark.r, primaryDark.g, primaryDark.b], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: fixedWidths.ticketId },
      1: { cellWidth: titleWidth },
      2: { cellWidth: fixedWidths.priority },
      3: { cellWidth: fixedWidths.status },
      4: { cellWidth: fixedWidths.assignee },
      5: { cellWidth: fixedWidths.created },
      6: { cellWidth: fixedWidths.sla },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 2) {
        const p = String(data.cell.raw ?? "");
        const fill = priorityFill[p];
        if (fill) {
          data.cell.styles.fillColor = fill;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.column.index === 6) {
        const sla = String(data.cell.raw ?? "").toLowerCase();
        if (sla === "met") {
          data.cell.styles.fillColor = [209, 250, 229];
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontStyle = "bold";
        }
        if (sla === "breached") {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawPage: (data) => drawHeaderFooter(data.pageNumber),
  });

  const fileBase = safeFilename(`dashboard-${formatDateStamp()}`);
  pdf.save(`${fileBase}.pdf`);
}

export async function exportDashboardToPdf(filters: FilterState, element?: HTMLElement | null) {
  try {
    await exportDashboardSummaryToPdf(filters);
  } catch {
    await exportDashboardSummaryToPdf(filters);
  }
}
