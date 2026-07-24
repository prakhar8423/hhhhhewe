import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Priority, Role, Status, Ticket, TicketEvent, EventKind } from '@/lib/types'
import { computeSlaDueAt } from '@/lib/sla'
import { generateSeed } from '@/lib/seed-tickets'
import { CURRENT_USER_ID } from '@/lib/seed-static'

const STORAGE_KEY = 'meridian-itsm-v1'

type NewTicketInput = {
  type: Ticket['type']
  subject: string
  description: string
  priority: Priority
  category: string
  requesterId: string
  source: Ticket['source']
}

type DataState = {
  tickets: Ticket[]
  events: TicketEvent[]
  seededAt: string
  addTicket: (input: NewTicketInput) => string
  addEvent: (ticketId: string, kind: EventKind, authorId: string, body: string, meta?: TicketEvent['meta']) => void
  updateTicket: (id: string, patch: Partial<Ticket>) => void
  setStatus: (id: string, status: Status, authorId: string, note?: string) => void
  setPriority: (id: string, priority: Priority, authorId: string) => void
  setAssignee: (id: string, assigneeId: string | null, authorId: string) => void
  bulkUpdate: (ids: string[], patch: Partial<Ticket>, authorId: string) => void
}

function nextTicketId(tickets: Ticket[], type: Ticket['type']): string {
  const prefix = type === 'incident' ? 'INC-' : 'REQ-'
  const nums = tickets
    .filter((t) => t.id.startsWith(prefix))
    .map((t) => parseInt(t.id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : type === 'incident' ? 1000 : 200) + 1
  return type === 'incident' ? `${prefix}${next}` : `${prefix}${next.toString().padStart(4, '0')}`
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...seedInitial(),
      addTicket: (input) => {
        const now = new Date().toISOString()
        const id = nextTicketId(get().tickets, input.type)
        const { slaResponseDueAt, slaResolutionDueAt } = computeSlaDueAt(now, input.priority)
        const ticket: Ticket = {
          id,
          type: input.type,
          subject: input.subject,
          description: input.description,
          status: 'new',
          priority: input.priority,
          category: input.category,
          requesterId: input.requesterId,
          assigneeId: null,
          createdAt: now,
          updatedAt: now,
          slaResponseDueAt,
          slaResolutionDueAt,
          firstRespondedAt: null,
          resolvedAt: null,
          resolutionNote: null,
          linkedArticleIds: [],
          source: input.source,
        }
        const event: TicketEvent = {
          id: `${id}-e0`,
          ticketId: id,
          kind: 'created',
          authorId: input.requesterId,
          body: `${input.type === 'incident' ? 'Incident' : 'Request'} created`,
          meta: { to: input.subject },
          createdAt: now,
        }
        set((s) => ({ tickets: [ticket, ...s.tickets], events: [...s.events, event] }))
        return id
      },
      addEvent: (ticketId, kind, authorId, body, meta) => {
        const now = new Date().toISOString()
        const event: TicketEvent = { id: `${ticketId}-e${Date.now()}`, ticketId, kind, authorId, body, meta, createdAt: now }
        set((s) => ({
          events: [...s.events, event],
          tickets: s.tickets.map((t) => {
            if (t.id !== ticketId) return t
            const patch: Partial<Ticket> = { updatedAt: now }
            if ((kind === 'comment' || kind === 'internal_note') && !t.firstRespondedAt) patch.firstRespondedAt = now
            return { ...t, ...patch }
          }),
        }))
      },
      updateTicket: (id, patch) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)) })),
      setStatus: (id, status, authorId, note) => {
        const ticket = get().tickets.find((t) => t.id === id)
        if (!ticket || ticket.status === status) return
        const now = new Date().toISOString()
        const isResolving = status === 'resolved' || status === 'closed'
        get().updateTicket(id, {
          status,
          resolvedAt: isResolving ? ticket.resolvedAt ?? now : ticket.resolvedAt,
          resolutionNote: isResolving && note ? note : ticket.resolutionNote,
        })
        get().addEvent(id, isResolving ? 'resolved' : 'status_change', authorId, note ?? 'Status changed', { from: ticket.status, to: status })
      },
      setPriority: (id, priority, authorId) => {
        const ticket = get().tickets.find((t) => t.id === id)
        if (!ticket || ticket.priority === priority) return
        const sla = computeSlaDueAt(ticket.createdAt, priority)
        get().updateTicket(id, { priority, ...sla })
        get().addEvent(id, 'priority_change', authorId, 'Priority changed', { from: ticket.priority, to: priority })
      },
      setAssignee: (id, assigneeId, authorId) => {
        const ticket = get().tickets.find((t) => t.id === id)
        if (!ticket || ticket.assigneeId === assigneeId) return
        get().updateTicket(id, { assigneeId })
        get().addEvent(id, 'assignment', authorId, 'Assignment changed', { from: ticket.assigneeId ?? 'unassigned', to: assigneeId ?? 'unassigned' })
      },
      bulkUpdate: (ids, patch, authorId) => {
        ids.forEach((id) => {
          if (patch.status) get().setStatus(id, patch.status, authorId)
          if (patch.assigneeId !== undefined) get().setAssignee(id, patch.assigneeId, authorId)
        })
      },
    }),
    { name: STORAGE_KEY, partialize: (s) => ({ tickets: s.tickets, events: s.events, seededAt: s.seededAt }) },
  ),
)

function seedInitial() {
  const { tickets, events } = generateSeed()
  return { tickets, events, seededAt: new Date().toISOString() }
}

// ---- UI store (ephemeral) ----
type UiState = {
  role: Extract<Role, 'agent' | 'employee'>
  currentUserId: string
  setRole: (role: Extract<Role, 'agent' | 'employee'>) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  queueTab: string
  setQueueTab: (tab: string) => void
  search: string
  setSearch: (v: string) => void
  filterStatus: Status | 'all'
  filterPriority: Priority | 'all'
  filterSla: 'all' | 'on_track' | 'at_risk' | 'breached'
  setFilter: (patch: Partial<Pick<UiState, 'filterStatus' | 'filterPriority' | 'filterSla'>>) => void
  clearFilters: () => void
  selectedIds: string[]
  toggleSelected: (id: string) => void
  clearSelected: () => void
  selectAll: (ids: string[]) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      role: 'agent',
      currentUserId: CURRENT_USER_ID,
      setRole: (role) => set({ role }),
      theme: 'dark',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      queueTab: 'all',
      setQueueTab: (queueTab) => set({ queueTab, selectedIds: [] }),
      search: '',
      setSearch: (search) => set({ search }),
      filterStatus: 'all',
      filterPriority: 'all',
      filterSla: 'all',
      setFilter: (patch) => set(patch),
      clearFilters: () => set({ filterStatus: 'all', filterPriority: 'all', filterSla: 'all', search: '' }),
      selectedIds: [],
      toggleSelected: (id) =>
        set((s) => ({ selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id] })),
      clearSelected: () => set({ selectedIds: [] }),
      selectAll: (ids) => set((s) => ({ selectedIds: s.selectedIds.length === ids.length ? [] : ids })),
    }),
    { name: 'meridian-ui-v1', partialize: (s) => ({ role: s.role, theme: s.theme, currentUserId: s.currentUserId }) },
  ),
)
