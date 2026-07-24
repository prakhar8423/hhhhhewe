import { Link } from 'react-router-dom'
import { StatusPill, PriorityPill, SlaText, TypeTag } from '@/components/pills'
import { UserAvatar } from '@/components/user-avatar'
import { getUserName } from '@/lib/lookups'
import { formatSlaCountdown, slaState } from '@/lib/sla'
import type { Ticket } from '@/lib/types'

export function TicketCards({ tickets, now }: { tickets: Ticket[]; now: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((t) => (
        <div key={t.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <TypeTag type={t.type} />
              <span className="font-mono text-xs text-muted-foreground">{t.id.split('-')[1]}</span>
            </div>
            <PriorityPill priority={t.priority} />
          </div>

          <div className="min-w-0">
            <Link to={`/tickets/${t.id}`} className="font-medium hover:text-primary hover:underline">
              {t.subject}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.category} · {getUserName(t.requesterId)}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <UserAvatar userId={t.assigneeId} size="sm" />
              <span className="text-sm text-muted-foreground">{getUserName(t.assigneeId)}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={t.status} />
              <SlaText state={slaState(t, now)}>{formatSlaCountdown(t, now)}</SlaText>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
