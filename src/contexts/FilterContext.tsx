import React, { createContext, useContext, useState, ReactNode } from "react";

export interface FilterState {
  dateRange: string;
  ticketStatus: string;
  priority: string;
  region: string;
  assignmentGroup: string;
  assignedTo: string;
  customStartDate?: string;
  customEndDate?: string;
}

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string | undefined) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  dateRange: "all",
  ticketStatus: "all",
  priority: "all",
  region: "all",
  assignmentGroup: "all",
  assignedTo: "all",
  customStartDate: undefined,
  customEndDate: undefined,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = (key: keyof FilterState, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
}

