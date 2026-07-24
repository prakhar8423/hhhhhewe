import type { Ticket } from '@/lib/types'
import { OPEN_STATUSES } from '@/lib/types'
import { slaState } from '@/lib/sla'
import { USERS } from '@/lib/seed-static'

const CLOSED_STATUSES: Ticket['status'][] = ['resolved', 'closed']

export interface AgentStats {
  id: string
  name: string
  team: string
  initials: string
  avatarColor: string
  resolved: number
  openLoad: number
  slaAttainment: number
  avgResponseMins: number
  score: number
}

/**
 * Rank support agents by a blended performance score:
 * resolved throughput, SLA attainment, and fast first response.
 */
export function rankAgents(tickets: Ticket[], now: number): AgentStats[] {
  const agents = USERS.filter((u) => u.role === 'agent' || u.role === 'lead')

  const stats = agents.map((agent) => {
    const owned = tickets.filter((t) => t.assigneeId === agent.id)
    const resolvedTickets = owned.filter((t) => CLOSED_STATUSES.includes(t.status) && t.resolvedAt)
    const met = resolvedTickets.filter((t) => slaState(t, now) !== 'breached').length
    const slaAttainment = resolvedTickets.length === 0 ? 0 : Math.round((met / resolvedTickets.length) * 100)

    const responded = owned.filter((t) => t.firstRespondedAt)
    const avgResponseMins =
      responded.length === 0
        ? 0
        : Math.round(
            responded.reduce(
              (sum, t) => sum + (new Date(t.firstRespondedAt!).getTime() - new Date(t.createdAt).getTime()) / 60000,
              0,
            ) / responded.length,
          )

    const openLoad = owned.filter((t) => OPEN_STATUSES.includes(t.status)).length

    return {
      id: agent.id,
      name: agent.name,
      team: agent.team,
      initials: agent.initials,
      avatarColor: agent.avatarColor,
      resolved: resolvedTickets.length,
      openLoad,
      slaAttainment,
      avgResponseMins,
      score: 0,
    }
  })

  const maxResolved = Math.max(1, ...stats.map((s) => s.resolved))
  const maxResponse = Math.max(1, ...stats.map((s) => s.avgResponseMins))

  const scored = stats.map((s) => {
    const throughput = (s.resolved / maxResolved) * 100
    const speed = s.avgResponseMins === 0 ? 60 : (1 - s.avgResponseMins / maxResponse) * 100
    const score = Math.round(throughput * 0.4 + s.slaAttainment * 0.4 + speed * 0.2)
    return { ...s, score }
  })

  return scored.sort((a, b) => b.score - a.score || b.resolved - a.resolved)
}

export function formatMins(mins: number): string {
  if (mins === 0) return '—'
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
}
