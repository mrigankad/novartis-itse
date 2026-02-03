import { Filter, MapPin, Layers, User, Moon, Sun, TicketCheck } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { getAllTickets } from "@/data/realData";

interface FilterOption {
  value: string;
  label: string;
}

const priorities: FilterOption[] = [
  { value: "all", label: "All Priorities" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Moderate" },
  { value: "P4", label: "P4 - Low" },
];

const regions: FilterOption[] = [
  { value: "all", label: "All Regions" },
  { value: "na", label: "North America" },
  { value: "emea", label: "EMEA" },
  { value: "apac", label: "APAC" },
  { value: "latam", label: "LATAM" },
  { value: "Other", label: "Other" },
];

const statuses: FilterOption[] = [
  { value: "all", label: "All Tickets" },
  { value: "open", label: "Open / Active" },
  { value: "closed", label: "Resolved / Closed" },
];

interface SelectFilterProps {
  icon: React.ReactNode;
  options: FilterOption[];
  filterKey: "ticketStatus" | "priority" | "region" | "assignmentGroup" | "assignedTo";
  defaultValue?: string;
}

function SelectFilter({ icon, options, filterKey, defaultValue }: SelectFilterProps) {
  const { filters, updateFilter } = useFilters();
  const currentValue = (filters as any)[filterKey] || defaultValue || options[0].value;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter(filterKey as any, e.target.value);
  };

  return (
    <div className="relative flex items-center min-w-[140px]">
      <div className="pointer-events-none absolute left-3 z-10 text-muted-foreground">
        {icon}
      </div>
      <select
        className="filter-select appearance-none pl-9 pr-9 py-2 text-sm font-medium bg-card border border-border rounded-lg text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-sm"
        value={currentValue}
        onChange={handleChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 z-10 text-muted-foreground">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export function GlobalFilters() {
  const { theme, toggleTheme } = useTheme();
  const tickets = getAllTickets();
  const uniqueAssignees = Array.from(new Set(tickets.map((t) => t.assignee))).filter(Boolean).sort();
  const uniqueGroups = Array.from(new Set(tickets.map((t) => t.assignmentGroup))).filter(Boolean).sort();

  const assignmentGroups: FilterOption[] = [
    { value: "all", label: "All Groups" },
    ...uniqueGroups.map((g) => ({
      value: g,
      label: g,
    })),
  ];

  const assignees: FilterOption[] = [
    { value: "all", label: "All Assignees" },
    ...uniqueAssignees.slice(0, 50).map((a) => ({ value: a, label: a })),
  ];

  return (
    <div className="sticky top-0 z-50 bg-dashboard-bg/80 backdrop-blur-md py-4 mb-2 -mx-2 px-2 rounded-lg flex flex-wrap items-center gap-3">
      <DatePickerWithRange />
      <SelectFilter
        icon={<TicketCheck className="h-4 w-4" />}
        options={statuses}
        filterKey="ticketStatus"
      />
      <SelectFilter
        icon={<Filter className="h-4 w-4" />}
        options={priorities}
        filterKey="priority"
      />
      <SelectFilter
        icon={<MapPin className="h-4 w-4" />}
        options={regions}
        filterKey="region"
      />
      <SelectFilter
        icon={<Layers className="h-4 w-4" />}
        options={assignmentGroups}
        filterKey="assignmentGroup"
      />
      <SelectFilter
        icon={<User className="h-4 w-4" />}
        options={assignees}
        filterKey="assignedTo"
      />
      <div className="flex items-center gap-2 ml-auto border-l border-border/50 pl-3">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
