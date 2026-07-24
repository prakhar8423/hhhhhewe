import { cn } from '@/lib/utils'
import { STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types'
import type { Priority, Status, TicketType } from '@/lib/types'
import { SLA_STATE_LABEL } from '@/lib/sla'
import type { SlaState } from '@/lib/sla'

const BASE = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap'
const DOT = 'size-1.5 rounded-full'

const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-[color-mix(in_srgb,var(--chart-1),transparent_85%)] text-[var(--chart-1)]',
  in_progress: 'bg-[color-mix(in_srgb,var(--chart-4),transparent_82%)] text-[var(--chart-4)]',
  on_hold: 'bg-[color-mix(in_srgb,var(--chart-3),transparent_82%)] text-[var(--chart-3)]',
  resolved: 'bg-[color-mix(in_srgb,var(--chart-2),transparent_82%)] text-[var(--chart-2)]',
  closed: 'bg-muted text-muted-foreground',
}

const STATUS_DOT: Record<Status, string> = {
  new: 'bg-[var(--chart-1)]',
  in_progress: 'bg-[var(--chart-4)]',
  on_hold: 'bg-[var(--chart-3)]',
  resolved: 'bg-[var(--chart-2)]',
  closed: 'bg-muted-foreground',
}

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn(BASE, STATUS_STYLE[status], className)}>
      <span className={cn(DOT, STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

const PRIORITY_STYLE: Record<Priority, string> = {
  p1: 'bg-destructive text-white',
  p2: 'bg-[color-mix(in_srgb,var(--chart-4),transparent_80%)] text-[var(--chart-4)]',
  p3: 'bg-[color-mix(in_srgb,var(--chart-1),transparent_85%)] text-[var(--chart-1)]',
  p4: 'bg-muted text-muted-foreground',
}

export function PriorityPill({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn(BASE, PRIORITY_STYLE[priority], className)}>{PRIORITY_LABEL[priority]}</span>
}

const SLA_STYLE: Record<SlaState, string> = {
  on_track: 'text-[var(--chart-2)]',
  at_risk: 'text-[var(--chart-4)]',
  breached: 'text-destructive',
  met: 'text-muted-foreground',
}

export function SlaText({ state, children, className }: { state: SlaState; children: React.ReactNode; className?: string }) {
  return <span className={cn('text-xs font-medium tabular-nums', SLA_STYLE[state], className)}>{children}</span>
}

export function TypeTag({ type }: { type: TicketType }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
      {type === 'incident' ? 'INC' : 'REQ'}
    </span>
  )
}
