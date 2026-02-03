# Novartis ITSM Platform - Design & Evolution Specification

## 1. Context & Reference Analysis

### Reference Summary
The current reference implementation (`ref` folder) is a **high-level Analytics Dashboard** for Incident Management.
-   **Core Intent:** Visualize operational metrics (Ticket Inflow, Backlog, MTTR, SLA Compliance) based on a snapshot of incident data.
-   **Current State:**
    -   **Tech Stack:** React (Vite), TypeScript, Tailwind CSS, Shadcn UI, Recharts.
    -   **Data:** Static JSON data (`incident-data.json`) transformed client-side.
    -   **Limitations:** Read-only view; no ticket management capability; no authentication; no role-based views; tightly coupled monolithic `Index.tsx`.
-   **Gap Analysis:**
    -   *Missing:* Active Ticket Management (CRUD), Workflow Automation, Role-Based Access Control (RBAC), Backend Integration, Real-time updates.
    -   *To Reuse:* The visual style (Shadcn UI), the Chart components (well-structured), and the KPI calculation logic (adaptable to backend).

### Key Learnings
-   **Visual Language:** The current "clean, data-dense" aesthetic is appropriate for enterprise use.
-   **Performance:** Client-side filtering of large datasets (implied by `realData.ts`) will not scale. Filtering must move to the backend.

---

## 2. Deep Codebase Understanding

### System Map
-   **Frontend:** Single-Page Application (SPA) using React Router.
    -   *Entry:* `main.tsx` -> `App.tsx` (Providers: Query, Theme, Filter, Tooltip).
    -   *State:* `FilterContext` (Global filter state).
    -   *UI:* Components based on Shadcn UI (`components/ui`).
    -   *Business Logic:* `data/realData.ts` (Data transformation layer).
-   **Backend (Current):** None. Simulates a backend via static file loading.
-   **Data Model:** `Incident` interface mirrors ServiceNow table structure (flat structure).

### Architecture Constraints & Debt
-   **Tight Coupling:** `Index.tsx` handles layout, data fetching, KPI calculation, and rendering. Needs splitting into specific views.
-   **Scalability:** Client-side processing of "all tickets" is a bottleneck.
-   **Technical Debt:** Hardcoded logic for SLA breaches in `realData.ts`.

---

## 3. Persona-Driven Design

### Primary Personas

#### 1. Service Desk Agent (L1)
-   **Goal:** Resolve user issues quickly (First Call Resolution).
-   **Pain Points:** Too many clicks to log tickets; unclear knowledge base links; context switching.
-   **Workflow:** Receive Call -> Search User -> Create/Update Ticket -> Check KB -> Resolve/Escalate.
-   **Key View:** "My Queue" (High priority, assigned to me), "New Ticket" Quick Form.

#### 2. L2/L3 Support Engineer
-   **Goal:** Deep dive into complex technical issues.
-   **Pain Points:** Lack of historical context; noise from duplicate tickets.
-   **Workflow:** Analyze Backlog -> Investigate Root Cause -> Collaborate -> Fix.
-   **Key View:** "Problem Investigation", "Related Incidents", "Server Health Metrics".

#### 3. IT Operations Manager
-   **Goal:** Ensure SLA compliance and team efficiency.
-   **Pain Points:** Blind spots in team performance; reactive rather than proactive.
-   **Workflow:** Review Dashboard (Morning) -> Identify Breaches -> Reassign Resources.
-   **Key View:** The *existing* Dashboard (enhanced with drill-downs).

#### 4. Business User (Employee)
-   **Goal:** Get work done without IT friction.
-   **Key View:** Self-Service Portal (Simple "Report Issue", "Request Service").

---

## 4. ITSM Capability Mapping

### Core Modules
1.  **Incident Management:**
    -   *Flow:* Create -> Triage -> Work in Progress -> Resolved -> Closed.
    -   *UI:* Split view (List + Detail), Activity Stream, SLA Timer.
2.  **Problem Management:**
    -   *Purpose:* Root cause analysis for recurring incidents.
    -   *Linkage:* One Problem <-> Many Incidents.
3.  **Change Management:**
    -   *Flow:* Request -> Impact Analysis -> CAB Approval -> Implementation -> Review.
    -   *UI:* Calendar View (Freeze periods), Risk Assessment Calculator.
4.  **Service Request (Catalog):**
    -   *UI:* Shopping cart experience for hardware/software.

---

## 5. UX Architecture

### Navigation Model
-   **Primary (Sidebar):** Modules (Dashboard, Incidents, Problems, Changes, Settings).
-   **Secondary (Top Bar):** Global Search, User Profile, Notifications, Quick Actions (+).
-   **Breadcrumbs:** Essential for deep navigation (e.g., `Incidents > INC12345 > Related Problems`).

### Information Architecture
-   **Dashboard:** High-level metrics.
-   **List Views:** Filterable, sortable tables with "Quick Edit" capabilities.
-   **Detail Views:**
    -   *Header:* Key info (ID, Status, Priority, Assignee).
    -   *Main:* Description, CI, categorization.
    -   *Sidebar:* SLA, Attachments, Related Records.
    -   *Footer:* Activity Log / Comments.

---

## 6. UI System & Design Language

-   **Typography:** Inter (Clean, legible). Headings for hierarchy, Monospace for Ticket IDs/Logs.
-   **Color Tokens:**
    -   *Severity:* Critical (Red-600), High (Orange-500), Moderate (Yellow-500), Low (Green-500).
    -   *Status:* New (Blue), In Progress (Purple), Resolved (Green), Closed (Gray).
-   **Components:**
    -   *DataTable:* Virtualized for performance.
    -   *StatusBadge:* Unified pill shape with dot indicator.
    -   *FilterBuilder:* Advanced boolean logic filters.

---

## 7. Workflow & Automation

-   **Smart Routing:** Auto-assign based on `Category` + `Location` logic (e.g., "Network" + "London" -> "UK Network Team").
-   **SLA Prediction:** AI warning "At Risk" if time elapsed > 75% of SLA.
-   **Similar Ticket Suggestion:** On creation, suggest KB articles or open major incidents to prevent duplicates.

---

## 8. Metrics & Observability

-   **Operational:** MTTR (Mean Time to Resolve), First Response Time, SLA Breach Rate.
-   **UX:** Task Completion Time, Search Success Rate.
-   **System:** API Latency, Error Rates.

---

## 9. Constraints & Compliance

-   **Audit Trails:** Every field change must be logged (Who, What, When).
-   **RBAC:** Strict separation. L1 cannot approve Changes.
-   **Data Privacy:** Mask PII in descriptions if user is not authorized.

---

## 10. Roadmap

### Phase 1: Foundation (Current Focus)
-   Refactor `Index.tsx` into modular components.
-   Implement Routing for distinct views (`/dashboard`, `/incidents`).
-   Establish Layout shell (Sidebar/Header).

### Phase 2: Interactive Data
-   Replace static filtering with performant local state (Context optimized).
-   Create "Incident Detail" view prototype.

### Phase 3: Advanced Features
-   Problem & Change modules.
-   Mock Backend integration.
