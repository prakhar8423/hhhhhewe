import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusPill, PriorityPill, SlaText, TypeTag } from '@/components/pills'
import { UserAvatar } from '@/components/user-avatar'
import { getUserName } from '@/lib/lookups'
import { formatSlaCountdown, slaState } from '@/lib/sla'
import { cn } from '@/lib/utils'
import type { Ticket } from '@/lib/types'

export function TicketTable({
  tickets,
  now,
  selectable,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  tickets: Ticket[]
  now: number
  selectable?: boolean
  selectedIds?: string[]
  onToggle?: (id: string) => void
  onToggleAll?: (ids: string[]) => void
}) {
  const allSelected = selectable && selectedIds && tickets.length > 0 && selectedIds.length === tickets.length
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onToggleAll?.(tickets.map((t) => t.id))}
                  aria-label="Select all"
                />
              </TableHead>
            ) : null}
            <TableHead className="w-28">Ticket</TableHead>
            <TableHead className="min-w-[16rem]">Subject</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="text-right">SLA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => {
            const isSelected = selectedIds?.includes(t.id)
            return (
              <TableRow key={t.id} className={cn('group', isSelected && 'bg-accent/50')}>
                {selectable ? (
                  <TableCell>
                    <Checkbox checked={isSelected} onCheckedChange={() => onToggle?.(t.id)} aria-label={`Select ${t.id}`} />
                  </TableCell>
                ) : null}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TypeTag type={t.type} />
                    <span className="font-mono text-xs text-muted-foreground">{t.id.split('-')[1]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link to={`/tickets/${t.id}`} className="font-medium hover:text-primary hover:underline">
                    {t.subject}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {getUserName(t.requesterId)}
                  </p>
                </TableCell>
                <TableCell>
                  <PriorityPill priority={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusPill status={t.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar userId={t.assigneeId} size="sm" />
                    <span className="hidden text-sm text-muted-foreground xl:inline">{getUserName(t.assigneeId)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <SlaText state={slaState(t, now)}>{formatSlaCountdown(t, now)}</SlaText>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
