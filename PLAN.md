# PLAN.md — Meridian Service Desk

## APP
- Name: Meridian
- An IT Service Management (ITSM) workspace where a service desk agent triages,
  works, and resolves incidents & requests against SLA targets — with a service
  catalog, knowledge base, SLA dashboard, and a lightweight employee portal.
- Target users: (1) service desk agents/technicians — primary; (2) IT team leads —
  reporting; (3) employees/requesters — self-service portal.
- Primary device: desktop (dense, multi-column agent workspace); responsive down to
  tablet/mobile for the portal and quick triage.

## FEATURES

1. **Ticket queue & triage**
   Central table of all tickets (incidents + service requests). Each row shows
   ticket ID (e.g. `INC-1042` / `REQ-0210`), subject, type, priority, status,
   requester, assignee, category, and a live SLA countdown ("2h 14m left" or
   "Breached 40m ago"). Full-text search across ID/subject/requester; filters for
   status, priority, type, assignee ("Assigned to me"), category, and SLA state
   (On track / At risk / Breached); sortable columns; saved quick-filter tabs
   (All, My tickets, Unassigned, Breaching soon). Bulk-select rows to reassign or
   change status.
   *Acceptance:* filters and search combine and update the row count; SLA countdown
   is computed from `slaDueAt` vs now and recolors at <2h (at risk) and past-due
   (breached); "Assigned to me" resolves against the current user; empty filter
   result shows a real empty state with a "Clear filters" action.

2. **Ticket detail & worklog**
   Two-pane view: left = subject, rich description, and a chronological activity
   timeline (comments, status changes, assignments, worklog notes) with author +
   relative timestamp; right = properties panel (status, priority, type, category,
   assignee, requester, created, SLA due, linked KB articles). Agent can add a
   public reply or an internal note (visually distinguished), change status,
   reassign, change priority, and log time — each action appends a timeline event.
   *Acceptance:* posting a comment/note prepends an event with author + timestamp;
   changing status/assignee/priority updates the properties AND writes a system
   event to the timeline; resolving prompts for a resolution note; all changes
   persist across reload.

3. **SLA engine & watchlist**
   Every ticket has a response and resolution SLA derived from its priority
   (P1 Critical → 1h/4h, P2 High → 2h/8h, P3 Moderate → 4h/24h, P4 Low → 8h/72h,
   business definition seeded). The system computes SLA state and highlights tickets
   at risk or breached. Dashboard "Breach watchlist" lists the nearest-to-breach
   open tickets.
   *Acceptance:* SLA state derives purely from priority policy + timestamps; changing
   priority recomputes `slaDueAt`; watchlist is sorted ascending by time-to-breach and
   excludes resolved/closed tickets.

4. **Service catalog & request submission**
   Grid of catalog offerings grouped by category (Hardware, Access, Software,
   Onboarding, Connectivity…), each with title, description, icon, fulfillment-time
   estimate, and any request fields. Opening an item shows a submission form drawer;
   submitting creates a new `REQ-` ticket in the queue and confirms with a toast.
   *Acceptance:* submitting a catalog item validates required fields, creates a ticket
   with the right category/priority defaults, and the new ticket appears in the queue;
   cancel discards without creating.

5. **Knowledge base**
   Searchable article library grouped by category, with a list/reader view. Article
   shows title, category, author, updated date, body (headings + steps), helpful
   vote count, and related articles. Search filters by title/body/tag. Articles can
   be linked from a ticket's properties panel.
   *Acceptance:* KB search narrows the list live; opening an article shows full body
   and related articles; empty search shows a "no articles match" state.

6. **Employee portal (requester view)**
   Simplified surface for non-agents: "My requests" list (status + SLA-friendly
   language, no internal notes), a "New request" flow reusing the catalog, and KB
   search. Toggled via a role switch in the top bar (Agent ⇄ Employee) since this is
   a UI-only demo.
   *Acceptance:* portal hides internal notes and agent-only controls; "My requests"
   shows only tickets whose requester is the current user; new request from portal
   lands in the shared queue.

7. **Dashboard (team & SLA overview)**
   Landing view for leads: KPI stat row (open tickets, breached today, avg first
   response, resolved this week), open-tickets-by-status bar chart, tickets-by-
   priority donut, an SLA-attainment trend line (last 14 days), the breach watchlist,
   and a recent-activity feed.
   *Acceptance:* every metric derives from ticket data; charts use `var(--chart-1..5)`;
   each chart handles an empty dataset with a placeholder.

## SCREENS

- **Dashboard** (`/`) — KPI row, status bar chart, priority donut, SLA trend line,
  breach watchlist table, recent activity. Empty: "No tickets yet — seed the desk"
  hint (won't show given seed data, but designed).
- **Ticket Queue** (`/tickets`) — quick-filter tabs, search + filter bar, dense data
  table, bulk-action bar when rows selected. Loading: skeleton rows. Empty (filtered):
  "No tickets match these filters" + Clear. Empty (none): onboarding empty state.
- **Ticket Detail** (`/tickets/:id`) — two-pane detail + worklog timeline + composer.
  Loading: skeleton. Not found: "Ticket not found" with back-to-queue link.
- **Service Catalog** (`/catalog`) — category sections, offering cards, submission
  drawer. Empty search: "No services match".
- **Knowledge Base** (`/kb`) — search, category rail, article list. Reader at
  (`/kb/:id`). Empty: "No articles match your search".
- **Employee Portal** (`/portal`) — my-requests list, new-request entry, KB search.
  Empty: "You haven't raised any requests yet" + New request CTA.
- **App shell** — left sidebar nav (Dashboard, Tickets, Catalog, Knowledge Base,
  Portal), top bar with global search, role switch (Agent/Employee), theme toggle,
  and current-user avatar.

## DATA MODEL & STATE

PERSISTENCE: local — all data lives in the browser via localStorage, managed with a
zustand store seeded on first run. No backend.

AUTH: public — no sign-in page. This is a single-user UI-only demo with a simulated
"current user" and an Agent/Employee role switch in the top bar. (If real accounts
were needed later this would become `login`.)

Entities (localStorage shapes):

- **Ticket**: `id` (string, `INC-####`/`REQ-####`), `type` ("incident" | "request"),
  `subject`, `description`, `status` ("new" | "in_progress" | "on_hold" | "resolved"
  | "closed"), `priority` ("p1" | "p2" | "p3" | "p4"), `category` (string),
  `requesterId`, `assigneeId` (nullable), `createdAt`, `updatedAt`, `slaResponseDueAt`,
  `slaResolutionDueAt`, `firstRespondedAt` (nullable), `resolvedAt` (nullable),
  `resolutionNote` (nullable), `linkedArticleIds` (string[]), `source`
  ("agent" | "catalog" | "portal").
- **TicketEvent**: `id`, `ticketId`, `kind` ("comment" | "internal_note" |
  "status_change" | "assignment" | "priority_change" | "worklog" | "created" |
  "resolved"), `authorId`, `body`, `meta` (from/to values), `createdAt`.
- **User**: `id`, `name`, `email`, `role` ("agent" | "lead" | "employee"), `team`,
  `avatarColor` (chart token), `initials`.
- **CatalogItem**: `id`, `title`, `description`, `category`, `icon` (lucide name),
  `fulfillmentEstimate` (string), `defaultPriority`, `fields` (array of
  `{label, type, required}`).
- **Article**: `id`, `title`, `category`, `body` (markdown-ish sections), `authorId`,
  `updatedAt`, `tags` (string[]), `helpfulCount`, `relatedArticleIds` (string[]).
- **SlaPolicy** (static const): priority → `{responseMins, resolutionMins}`.

Seed data (realistic, plentiful):
- **40+ tickets** across all statuses, priorities, types, categories, and assignees;
  timestamps spread across the last 14 days; a realistic mix so lists/charts look
  alive and the watchlist has genuine at-risk/breached rows.
- **8–10 users** (agents, one lead, several employees) with distinct names/teams.
- **60+ ticket events** distributed across tickets (comments, notes, status changes)
  so detail timelines are populated.
- **12+ catalog items** across 5 categories.
- **10+ KB articles** across categories with related-article links.

UI state (zustand `src/lib/store.ts`, not server data): active quick-filter tab,
search text, filter selections, table sort, row selection, active role
(agent/employee), current user id, drawer/dialog open state, theme.

## COMPONENTS (shadcn/ui)
- **Table** + custom header — ticket queue, watchlist, my-requests.
- **Tabs** — quick-filter tabs, ticket detail sub-tabs, KB categories.
- **Badge** — status pills, priority pills, SLA-state pills, type tags.
- **Card** — dashboard KPI tiles, catalog offering cards, article cards.
- **Dialog / Sheet (drawer)** — catalog submission, new request, bulk-action confirm.
- **Select, Input, Textarea, Label, Checkbox, Switch** — filters, forms, composer,
  role switch, theme toggle.
- **DropdownMenu** — row actions, assignee picker, status picker.
- **Avatar** — users (colored initials via chart tokens).
- **Separator, ScrollArea, Skeleton, Tooltip, Sonner (toast)** — structure, loading,
  hints, action feedback.
- **recharts** — bar (status), donut/pie (priority), line (SLA trend); colors via
  `var(--chart-1..5)`.

## DESIGN SYSTEM

**Color mode:** Dark (default). Scene: a service desk technician triaging a queue for
eight hours in a dim, open-plan IT operations office, scanning SLA timers and status
pills continuously. Dark reduces fatigue over long sessions and lets status color read
as pure signal. A light mode is fully specified for the theme toggle and the daytime
employee portal.

**Color strategy:** Committed. A deep blue-tinted near-black surface carries the
workspace; the cobalt primary owns navigation, primary actions, selection, and focus;
a disciplined semantic vocabulary (success/warning/error/info) carries all status. No
decorative color — color always means status or action.

**Brand hue:** cobalt/indigo, OKLCH hue ~240 (seed 230, pulled a touch cooler-blue).

**Palette (dark, primary mode):**
- background `oklch(0.170 0.012 245)`, foreground `oklch(0.955 0.004 245)`
- card/popover `oklch(0.212 0.014 245)`; sidebar `oklch(0.150 0.013 245)` (a deeper
  panel neutral so the sidebar reads as a distinct zone)
- primary `oklch(0.660 0.145 240)`, primary-foreground `oklch(0.170 0.012 245)`
- muted/secondary `oklch(0.268 0.016 245)`, muted-foreground `oklch(0.720 0.012 245)`
- border `oklch(0.290 0.016 245)`, input `oklch(0.300 0.016 245)`, ring = primary
- Neutrals carry ~0.012–0.016 chroma toward the brand hue (cohesion, not visible tint).

**Palette (light, for toggle/portal):** pure-white `oklch(1 0 0)` background, ink
`oklch(0.235 0.018 245)`, primary `oklch(0.520 0.150 240)` — see theme.json for full set.

**Semantic colors (status vocabulary):**
- Status: New = info blue (chart-1 / primary family) · In Progress = amber
  `oklch(0.780 0.140 75)` · On Hold = violet `oklch(0.680 0.150 300)` · Resolved =
  green `oklch(0.700 0.150 155)` · Closed = neutral muted.
- Priority: P1 Critical = red `oklch(0.630 0.196 25)` · P2 High = amber · P3 Moderate =
  blue · P4 Low = neutral/green.
- SLA state: On track = green · At risk = amber · Breached = red (destructive).
- All filled pills use light/white foreground on saturated mid-tone fills per contrast
  rules; low-emphasis pills use a tinted bg + same-hue darker text.

**Contrast (WCAG AA):** foreground on background ≥ 12:1; muted-foreground
`oklch(0.720…)` on background ≥ 4.5:1 (used for secondary text, not primary body);
primary-foreground on primary verified AA; status-pill foregrounds chosen per fill
luminance (white on saturated, dark only on pale/neutral fills).

**Fonts:** Heading = **Sora** (geometric, structured, confident — the "operations room"
voice) for page titles, section headers, KPI numbers, ticket IDs. Body = **Hanken
Grotesk** (humanist grotesque, excellent legibility at small/dense table sizes) for all
UI text, tables, forms, and prose. Paired on a contrast axis (geometric heading vs
humanist body) — neither is a reflex-default sans. Fixed rem scale (ratio ~1.2), not
fluid; tables run dense.

**Layout:** Persistent left sidebar (nav + role context) + top bar (global search, role
switch, theme toggle, avatar). Content is dense and multi-column on desktop; the sidebar
collapses to an icon rail / sheet on tablet and mobile. Ticket detail is a two-pane
(main + properties) layout that stacks on narrow screens. Density: compact — this is a
tool, information-forward. Dark mode is the default; light mode swaps the `.dark` token
set via a class toggle (no per-component overrides).

**Corner radius:** `0.375rem` — crisp and precise, matching a methodical operations tool;
avoids the soft/friendly `0.625rem` template default and the over-rounded look.

**Charts:** recharts using `var(--chart-1..5)` — a deliberate multi-hue sequence (cobalt
240 → teal 190 → violet 300 → amber 75 → rose 350), not five tints of one hue.

**Motion:** 150–250ms state transitions only (hover, selection, drawer/sheet slide,
skeleton→content crossfade, SLA-pill recolor). No decorative or page-load choreography.
Respects `prefers-reduced-motion`.

**Avoided AI tells:** no purple/blue gradients, no cream/sand body bg, no gradient text,
no colored side-stripe status borders (status = full pills/tints), no glassmorphism.

## NOTES
- No preferences were given; defaults chosen for the higher-ceiling standard ITSM tool:
  agent-centered workspace + employee portal, covering ticketing, SLA, catalog, KB, and
  dashboard.
- UI-only (localStorage) per persistence default; no backend, no real auth. The
  Agent/Employee role switch simulates multi-role in a single-user demo.
- Non-goals for v1: change management / approvals, asset/CMDB inventory, email
  ingestion, real notifications, multi-tenant admin. Data model leaves room to add them.
- SLA policy is a seeded business rule (priority → response/resolution minutes); all SLA
  state is derived, never stored stale.
