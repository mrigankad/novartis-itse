import { GlobalFilters } from "./GlobalFilters";
import { useFilters } from "@/contexts/FilterContext";
import Logo from "@/assets/Logo.svg";

interface DashboardHeaderProps {
  onExport?: () => void;
}

export function DashboardHeader({ onExport }: DashboardHeaderProps) {
  const { filters } = useFilters();
  const activeFiltersCount = [
    filters.priority !== "all",
    filters.region !== "all",
    filters.assignmentGroup !== "all",
    filters.assignedTo !== "all",
  ].filter(Boolean).length;

  return (
    <header className="flex flex-col gap-4">
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
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>
      </div>
      <GlobalFilters onExport={onExport} />
    </header>
  );
}
