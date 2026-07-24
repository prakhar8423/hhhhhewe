import type { Priority, Status, Ticket } from '@/lib/types'
import { OPEN_STATUSES } from '@/lib/types'
import { slaState, timeToBreachMs } from '@/lib/sla'
import { getUserName } from '@/lib/lookups'

export type QueueFilters = {
  tab: string
  currentUserId: string
  search: string
  status: Status | 'all'
  priority: Priority | 'all'
  sla: 'all' | 'on_track' | 'at_risk' | 'breached'
}

function matchesTab(ticket: Ticket, tab: string, currentUserId: string, now: number): boolean {
  if (tab === 'mine') return ticket.assigneeId === currentUserId
  if (tab === 'unassigned') return ticket.assigneeId === null && OPEN_STATUSES.includes(ticket.status)
  if (tab === 'breaching') {
    if (!OPEN_STATUSES.includes(ticket.status)) return false
    const s = slaState(ticket, now)
    return s === 'at_risk' || s === 'breached'
  }
  return true
}

export function filterTickets(tickets: Ticket[], f: QueueFilters, now: number): Ticket[] {
  const q = f.search.trim().toLowerCase()
  return tickets.filter((t) => {
    if (!matchesTab(t, f.tab, f.currentUserId, now)) return false
    if (f.status !== 'all' && t.status !== f.status) return false
    if (f.priority !== 'all' && t.priority !== f.priority) return false
    if (f.sla !== 'all') {
      if (!OPEN_STATUSES.includes(t.status)) return false
      if (slaState(t, now) !== f.sla) return false
    }
    if (q) {
      const hay = `${t.id} ${t.subject} ${getUserName(t.requesterId)} ${getUserName(t.assigneeId)}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function breachWatchlist(tickets: Ticket[], now: number, limit = 6): Ticket[] {
  return tickets
    .filter((t) => OPEN_STATUSES.includes(t.status))
    .sort((a, b) => timeToBreachMs(a, now) - timeToBreachMs(b, now))
    .slice(0, limit)
}
