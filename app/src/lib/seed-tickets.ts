import type { Priority, Status, Ticket, TicketEvent, TicketType } from '@/lib/types'
import { computeSlaDueAt } from '@/lib/sla'
import { AGENT_IDS, EMPLOYEE_IDS } from '@/lib/seed-static'

const CATEGORIES = ['Hardware', 'Software', 'Access', 'Connectivity', 'Onboarding', 'Email']

const INCIDENT_SUBJECTS = [
  'Laptop will not power on',
  'Outlook keeps crashing on launch',
  'Cannot connect to office Wi-Fi',
  'VPN disconnects every few minutes',
  'Blue screen after latest update',
  'Shared drive not accessible',
  'Printer on 3rd floor offline',
  'Email delivery delayed',
  'Two-factor prompt not arriving',
  'Screen flickering intermittently',
  'Application license expired error',
  'Slow performance across all apps',
  'External monitor not detected',
  'Locked out of account',
  'Zoom audio not working in meetings',
]

const REQUEST_SUBJECTS = [
  'New laptop for incoming hire',
  'Additional 27" monitor request',
  'Adobe Creative Cloud license',
  'VPN access for remote work',
  'Access to Finance shared drive',
  'Password reset for CRM',
  'Onboarding for new marketing hire',
  'Offboarding — reclaim equipment',
  'Conference room AV setup',
  'Create distribution list for Sales',
  'Replacement keyboard and mouse',
  'Figma team seat request',
]

const COMMENTS = [
  'Thanks for reporting — taking a look now.',
  'Could you confirm which building floor you are on?',
  'I have escalated this to the network team.',
  'Reproduced the issue on my end, working on a fix.',
  'Can you try restarting and let me know if it persists?',
  'Update: replacement part has been ordered.',
]

const NOTES = [
  'Checked asset record — device is under warranty.',
  'Similar tickets spiked this morning, likely related to the AP outage.',
  'Requester is a VIP, prioritising.',
  'Waiting on vendor RMA before we can proceed.',
]

const STATUS_WEIGHTS: { status: Status; weight: number }[] = [
  { status: 'new', weight: 5 },
  { status: 'in_progress', weight: 6 },
  { status: 'on_hold', weight: 2 },
  { status: 'resolved', weight: 4 },
  { status: 'closed', weight: 4 },
]

const PRIORITY_WEIGHTS: { priority: Priority; weight: number }[] = [
  { priority: 'p1', weight: 2 },
  { priority: 'p2', weight: 4 },
  { priority: 'p3', weight: 6 },
  { priority: 'p4', weight: 3 },
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted<T>(rand: () => number, items: { weight: number }[] & T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rand() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

export function generateSeed(now: number = Date.now()): { tickets: Ticket[]; events: TicketEvent[] } {
  const rand = mulberry32(20260724)
  const tickets: Ticket[] = []
  const events: TicketEvent[] = []
  const DAY = 86400000
  const TICKET_COUNT = 44

  let incCounter = 1000
  let reqCounter = 200

  for (let i = 0; i < TICKET_COUNT; i++) {
    const type: TicketType = rand() < 0.6 ? 'incident' : 'request'
    const status = pickWeighted<{ status: Status; weight: number }>(rand, STATUS_WEIGHTS as never).status
    const priority = pickWeighted<{ priority: Priority; weight: number }>(rand, PRIORITY_WEIGHTS as never).priority
    const createdAt = new Date(now - rand() * 13 * DAY - rand() * DAY).toISOString()
    const id = type === 'incident' ? `INC-${++incCounter}` : `REQ-${(++reqCounter).toString().padStart(4, '0')}`
    const subjects = type === 'incident' ? INCIDENT_SUBJECTS : REQUEST_SUBJECTS
    const subject = subjects[i % subjects.length]
    const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)]
    const requesterId = EMPLOYEE_IDS[Math.floor(rand() * EMPLOYEE_IDS.length)]
    const isUnassigned = status === 'new' && rand() < 0.6
    const assigneeId = isUnassigned ? null : AGENT_IDS[Math.floor(rand() * AGENT_IDS.length)]
    const { slaResponseDueAt, slaResolutionDueAt } = computeSlaDueAt(createdAt, priority)

    const isDone = status === 'resolved' || status === 'closed'
    const respondedOffset = 30 + rand() * 180
    const firstRespondedAt = status === 'new' ? null : new Date(new Date(createdAt).getTime() + respondedOffset * 60000).toISOString()
    const resolvedAt = isDone ? new Date(new Date(createdAt).getTime() + (rand() * 20 + 2) * 3600000).toISOString() : null

    const ticket: Ticket = {
      id,
      type,
      subject,
      description: `${subject}. Reported via the service desk. The user is impacted and requests assistance to restore normal service as soon as possible.`,
      status,
      priority,
      category,
      requesterId,
      assigneeId,
      createdAt,
      updatedAt: resolvedAt ?? firstRespondedAt ?? createdAt,
      slaResponseDueAt,
      slaResolutionDueAt,
      firstRespondedAt,
      resolvedAt,
      resolutionNote: isDone ? 'Issue resolved and verified with the requester.' : null,
      linkedArticleIds: rand() < 0.3 ? ['kb-01'] : [],
      source: 'agent',
    }
    tickets.push(ticket)

    let eventTime = new Date(createdAt).getTime()
    let eventSeq = 0
    const pushEvent = (kind: TicketEvent['kind'], authorId: string, body: string, meta?: TicketEvent['meta']) => {
      eventTime += (10 + rand() * 120) * 60000
      events.push({ id: `${id}-e${eventSeq++}`, ticketId: id, kind, authorId, body, meta, createdAt: new Date(eventTime).toISOString() })
    }

    pushEvent('created', requesterId, `${type === 'incident' ? 'Incident' : 'Request'} created`, { to: subject })
    if (assigneeId) pushEvent('assignment', 'u-lead-01', 'Assigned ticket', { to: assigneeId })
    if (firstRespondedAt && assigneeId) pushEvent('comment', assigneeId, COMMENTS[Math.floor(rand() * COMMENTS.length)])
    if (rand() < 0.5 && assigneeId) pushEvent('internal_note', assigneeId, NOTES[Math.floor(rand() * NOTES.length)])
    if (status === 'in_progress' && assigneeId) pushEvent('status_change', assigneeId, 'Status changed', { from: 'new', to: 'in_progress' })
    if (isDone && assigneeId) {
      pushEvent('worklog', assigneeId, `Logged ${Math.ceil(rand() * 3)}h of work`)
      pushEvent('resolved', assigneeId, 'Issue resolved and verified with the requester.', { to: 'resolved' })
    }
  }

  return { tickets, events }
}
