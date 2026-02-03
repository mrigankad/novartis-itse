import { GlobalFilters } from "./GlobalFilters";
import { useFilters } from "@/contexts/FilterContext";
import Logo from "@/assets/Logo.svg";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportDashboardToExcel, exportDashboardToPdf } from "@/lib/dashboardExport";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";

interface DashboardHeaderProps {
}

export function DashboardHeader({}: DashboardHeaderProps) {
  const { filters } = useFilters();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const location = useLocation();
  const showGlobalSlicers = !location.pathname.startsWith("/leaderboards");
  const activeFiltersCount = [
    filters.priority !== "all",
    filters.region !== "all",
    filters.assignmentGroup !== "all",
    filters.assignedTo !== "all",
  ].filter(Boolean).length;

  const handleExportExcel = async () => {
    setMenuOpen(false);
    setExporting("excel");
    try {
      await exportDashboardToExcel(filters);
      toast({ title: "Export started", description: "Downloading Excel file." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Failed to export Excel" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setMenuOpen(false);
    setExporting("pdf");
    try {
      const el = document.getElementById("dashboard-export-root");
      await exportDashboardToPdf(filters, el);
      toast({ title: "Export started", description: "Downloading PDF file." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Failed to export PDF" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center flex-shrink-0">
          <img
            src={Logo}
            alt="Novartis Logo"
            className="h-9 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
          />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight font-heading">
            Novartis ITSE 
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ServiceNow Analytics • Novartis
            {showGlobalSlicers && activeFiltersCount > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant={location.pathname === "/" ? "default" : "outline"}>
            <Link to="/">Dashboard</Link>
          </Button>
          <Button asChild variant={location.pathname.startsWith("/leaderboards") ? "default" : "outline"}>
            <Link to="/leaderboards">Leaderboards</Link>
          </Button>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={exporting !== null}>
                <Download className="h-4 w-4" />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleExportExcel} disabled={exporting !== null}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportPdf} disabled={exporting !== null}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showGlobalSlicers ? <GlobalFilters /> : null}
    </header>
  );
}
