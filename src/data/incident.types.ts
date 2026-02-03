// ================= AUTO-GENERATED =================
// Source: incident - 2025-12-16T101558.703.xlsx

export interface Incident {
  number: string;
  opened: string;
  shortDescription: string;
  assignmentGroup: string;
  assignedTo?: string;
  itIncidentOwnerItIncident?: number;
  state: string;
  owningSupportGroup: string;
  contactType: string;
  priority: string;
  category?: string;
  subcategory?: string;
  impactedService?: string;
  impactedConfigurationItem: string;
  impact: string;
  impactedServiceOffering?: string;
  resolutionCategory?: string;
  resolutionSubCategory?: string;
  resolutionCode?: string;
  resolvedBy: string;
  resolveTime: number;
  resolved: string;
  created: string;
  createdBy: string;
  closed: string;
  closedBy: string;
  firstServiceOffering?: string;
  serviceOffering?: string;
  businessOwnerCountry?: string;
  region?: string;
  location?: string;
  businessUnitDivision?: string;
  businessUnitDivision1?: string;
  parentIncident?: string;
  kbUsedForResolution?: string;
  reassignmentCount: number;
  knowledgeArticleNotFound: boolean;
  reopenCount: number;
  language?: string;
  businessDuration: number;
}

// ---------- Filter Types ----------
export type TextFilter = string;
export type SelectFilter = string[];
export type NumberRangeFilter = {
  min?: number;
  max?: number;
};
export type DateRangeFilter = {
  from?: string;
  to?: string;
};

// ---------- Incident Filters ----------
export interface IncidentFilters {
  number?: TextFilter;
  opened?: DateRangeFilter;
  shortDescription?: TextFilter;
  assignmentGroup?: SelectFilter;
  assignedTo?: TextFilter;
  itIncidentOwnerItIncident?: SelectFilter;
  state?: SelectFilter;
  owningSupportGroup?: TextFilter;
  contactType?: SelectFilter;
  priority?: SelectFilter;
  category?: SelectFilter;
  subcategory?: TextFilter;
  impactedService?: TextFilter;
  impactedConfigurationItem?: TextFilter;
  impact?: SelectFilter;
  impactedServiceOffering?: TextFilter;
  resolutionCategory?: SelectFilter;
  resolutionSubCategory?: TextFilter;
  resolutionCode?: SelectFilter;
  resolvedBy?: TextFilter;
  resolveTime?: NumberRangeFilter;
  resolved?: DateRangeFilter;
  created?: DateRangeFilter;
  createdBy?: TextFilter;
  closed?: DateRangeFilter;
  closedBy?: TextFilter;
  firstServiceOffering?: TextFilter;
  serviceOffering?: TextFilter;
  businessOwnerCountry?: TextFilter;
  region?: SelectFilter;
  location?: TextFilter;
  businessUnitDivision?: SelectFilter;
  businessUnitDivision1?: SelectFilter;
  parentIncident?: SelectFilter;
  kbUsedForResolution?: TextFilter;
  reassignmentCount?: SelectFilter;
  knowledgeArticleNotFound?: SelectFilter;
  reopenCount?: SelectFilter;
  language?: SelectFilter;
  businessDuration?: NumberRangeFilter;
}

// ---------- Filter Config (UI Driven) ----------
export const INCIDENT_FILTER_CONFIG = {
  number: {
    label: "Number",
    type: "text"
  },
  opened: {
    label: "Opened",
    type: "daterange"
  },
  shortDescription: {
    label: "Short description",
    type: "text"
  },
  assignmentGroup: {
    label: "Assignment Group",
    type: "select"
  },
  assignedTo: {
    label: "Assigned to",
    type: "text"
  },
  itIncidentOwnerItIncident: {
    label: "IT Incident Owner [IT Incident]",
    type: "select"
  },
  state: {
    label: "State",
    type: "select"
  },
  owningSupportGroup: {
    label: "Owning Support Group",
    type: "text"
  },
  contactType: {
    label: "Contact type",
    type: "select"
  },
  priority: {
    label: "Priority",
    type: "select"
  },
  category: {
    label: "Category",
    type: "select"
  },
  subcategory: {
    label: "Subcategory",
    type: "text"
  },
  impactedService: {
    label: "Impacted service",
    type: "text"
  },
  impactedConfigurationItem: {
    label: "Impacted Configuration Item",
    type: "text"
  },
  impact: {
    label: "Impact",
    type: "select"
  },
  impactedServiceOffering: {
    label: "Impacted Service Offering",
    type: "text"
  },
  resolutionCategory: {
    label: "Resolution Category",
    type: "select"
  },
  resolutionSubCategory: {
    label: "Resolution Sub Category",
    type: "text"
  },
  resolutionCode: {
    label: "Resolution code",
    type: "select"
  },
  resolvedBy: {
    label: "Resolved by",
    type: "text"
  },
  resolveTime: {
    label: "Resolve time",
    type: "numberrange"
  },
  resolved: {
    label: "Resolved",
    type: "daterange"
  },
  created: {
    label: "Created",
    type: "daterange"
  },
  createdBy: {
    label: "Created by",
    type: "text"
  },
  closed: {
    label: "Closed",
    type: "daterange"
  },
  closedBy: {
    label: "Closed by",
    type: "text"
  },
  firstServiceOffering: {
    label: "First Service Offering",
    type: "text"
  },
  serviceOffering: {
    label: "Service Offering",
    type: "text"
  },
  businessOwnerCountry: {
    label: "Business Owner Country",
    type: "text"
  },
  region: {
    label: "Region",
    type: "select"
  },
  location: {
    label: "Location",
    type: "text"
  },
  businessUnitDivision: {
    label: "Business Unit (Division)",
    type: "select"
  },
  businessUnitDivision1: {
    label: "Business Unit (Division).1",
    type: "select"
  },
  parentIncident: {
    label: "Parent Incident",
    type: "select"
  },
  kbUsedForResolution: {
    label: "KB used for resolution",
    type: "text"
  },
  reassignmentCount: {
    label: "Reassignment count",
    type: "select"
  },
  knowledgeArticleNotFound: {
    label: "Knowledge article not found",
    type: "select"
  },
  reopenCount: {
    label: "Reopen count",
    type: "select"
  },
  language: {
    label: "Language",
    type: "select"
  },
  businessDuration: {
    label: "Business duration",
    type: "numberrange"
  },
} as const;