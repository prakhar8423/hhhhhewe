import { SLA_POLICY, OPEN_STATUSES } from '@/lib/types'
import type { Priority, Ticket } from '@/lib/types'

export const SLA_STATES = ['on_track', 'at_risk', 'breached', 'met'] as const
export type SlaState = (typeof SLA_STATES)[number]

const AT_RISK_THRESHOLD_MS = 2 * 60 * 60 * 1000

export function computeSlaDueAt(createdAt: string, priority: Priority) {
  const created = new Date(createdAt).getTime()
  const policy = SLA_POLICY[priority]
  return {
    slaResponseDueAt: new Date(created + policy.responseMins * 60 * 1000).toISOString(),
    slaResolutionDueAt: new Date(created + policy.resolutionMins * 60 * 1000).toISOString(),
  }
}

export function slaState(ticket: Ticket, now: number = Date.now()): SlaState {
  const isOpen = OPEN_STATUSES.includes(ticket.status)
  const due = new Date(ticket.slaResolutionDueAt).getTime()
  if (!isOpen) {
    const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now
    return resolvedAt <= due ? 'met' : 'breached'
  }
  const remaining = due - now
  if (remaining <= 0) return 'breached'
  if (remaining <= AT_RISK_THRESHOLD_MS) return 'at_risk'
  return 'on_track'
}

export function timeToBreachMs(ticket: Ticket, now: number = Date.now()) {
  return new Date(ticket.slaResolutionDueAt).getTime() - now
}

export function formatSlaCountdown(ticket: Ticket, now: number = Date.now()): string {
  if (!OPEN_STATUSES.includes(ticket.status)) {
    return slaState(ticket, now) === 'met' ? 'Met' : 'Missed'
  }
  const diff = timeToBreachMs(ticket, now)
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000) % 60
  const hours = Math.floor(abs / 3600000) % 24
  const days = Math.floor(abs / 86400000)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (days === 0) parts.push(`${mins}m`)
  const text = parts.join(' ')
  return diff < 0 ? `Breached ${text} ago` : `${text} left`
}

export const SLA_STATE_LABEL: Record<SlaState, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  breached: 'Breached',
  met: 'Met',
}
