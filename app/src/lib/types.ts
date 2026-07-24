export const TICKET_TYPES = ['incident', 'request'] as const
export type TicketType = (typeof TICKET_TYPES)[number]

export const STATUSES = ['new', 'in_progress', 'on_hold', 'resolved', 'closed'] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['p1', 'p2', 'p3', 'p4'] as const
export type Priority = (typeof PRIORITIES)[number]

export const ROLES = ['agent', 'lead', 'employee'] as const
export type Role = (typeof ROLES)[number]

export const EVENT_KINDS = [
  'created',
  'comment',
  'internal_note',
  'status_change',
  'assignment',
  'priority_change',
  'worklog',
  'resolved',
] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const TICKET_SOURCES = ['agent', 'catalog', 'portal'] as const
export type TicketSource = (typeof TICKET_SOURCES)[number]

export interface User {
  id: string
  name: string
  email: string
  role: Role
  team: string
  avatarColor: string
  initials: string
}

export interface Ticket {
  id: string
  type: TicketType
  subject: string
  description: string
  status: Status
  priority: Priority
  category: string
  requesterId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  slaResponseDueAt: string
  slaResolutionDueAt: string
  firstRespondedAt: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  linkedArticleIds: string[]
  source: TicketSource
}

export interface TicketEvent {
  id: string
  ticketId: string
  kind: EventKind
  authorId: string
  body: string
  meta?: { from?: string; to?: string }
  createdAt: string
}

export interface CatalogField {
  label: string
  type: 'text' | 'textarea' | 'select'
  required: boolean
  options?: string[]
}

export interface CatalogItem {
  id: string
  title: string
  description: string
  category: string
  icon: string
  fulfillmentEstimate: string
  defaultPriority: Priority
  fields: CatalogField[]
}

export interface Article {
  id: string
  title: string
  category: string
  body: string
  authorId: string
  updatedAt: string
  tags: string[]
  helpfulCount: number
  relatedArticleIds: string[]
}

export const SLA_POLICY: Record<Priority, { responseMins: number; resolutionMins: number }> = {
  p1: { responseMins: 60, resolutionMins: 240 },
  p2: { responseMins: 120, resolutionMins: 480 },
  p3: { responseMins: 240, resolutionMins: 1440 },
  p4: { responseMins: 480, resolutionMins: 4320 },
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  p1: 'P1 · Critical',
  p2: 'P2 · High',
  p3: 'P3 · Moderate',
  p4: 'P4 · Low',
}

export const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const OPEN_STATUSES: Status[] = ['new', 'in_progress', 'on_hold']
