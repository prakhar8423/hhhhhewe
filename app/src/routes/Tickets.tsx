import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FilterX, Inbox, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader, EmptyState } from '@/components/page-header'
import { TicketTable } from '@/components/ticket-table'
import { TicketCards } from '@/components/ticket-cards'
import { ViewToggle } from '@/components/view-toggle'
import type { ViewMode } from '@/components/view-toggle'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore, useUiStore } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import { filterTickets } from '@/lib/derive'
import { STATUSES, PRIORITIES, STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types'
import { AGENT_IDS } from '@/lib/seed-static'
import { getUserName } from '@/lib/lookups'
import type { Status } from '@/lib/types'

const TABS = [
  { value: 'all', label: 'All tickets' },
  { value: 'mine', label: 'My tickets' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'breaching', label: 'Breaching soon' },
] as const

const SLA_OPTIONS = [
  { value: 'all', label: 'Any SLA' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'breached', label: 'Breached' },
] as const

export default function Tickets() {
  const tickets = useDataStore((s) => s.tickets)
  const bulkUpdate = useDataStore((s) => s.bulkUpdate)
  const now = useNow()

  const ui = useUiStore()
  const { queueTab, search, filterStatus, filterPriority, filterSla, selectedIds } = ui
  const [view, setView] = useState<ViewMode>('table')

  const filtered = useMemo(
    () =>
      filterTickets(tickets, {
        tab: queueTab,
        currentUserId: ui.currentUserId,
        search,
        status: filterStatus,
        priority: filterPriority,
        sla: filterSla,
      }, now),
    [tickets, queueTab, ui.currentUserId, search, filterStatus, filterPriority, filterSla, now],
  )

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterSla !== 'all' || search.trim() !== ''

  function handleBulkStatus(status: Status) {
    bulkUpdate(selectedIds, { status }, ui.currentUserId)
    toast.success(`Updated ${selectedIds.length} ticket(s) to ${STATUS_LABEL[status]}`)
    ui.clearSelected()
  }

  function handleBulkAssign(assigneeId: string) {
    bulkUpdate(selectedIds, { assigneeId }, ui.currentUserId)
    toast.success(`Reassigned ${selectedIds.length} ticket(s) to ${getUserName(assigneeId)}`)
    ui.clearSelected()
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <PageHeader
          title="Ticket queue"
          description={`${filtered.length} ticket${filtered.length === 1 ? '' : 's'} matching your view.`}
          actions={
            <ViewToggle
              view={view}
              onViewChange={(v) => {
                if (v === 'cards') ui.clearSelected()
                setView(v)
              }}
            />
          }
        />

        <Tabs value={queueTab} onValueChange={ui.setQueueTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => ui.setFilter({ filterStatus: v as Status | 'all' })}>
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(v) => ui.setFilter({ filterPriority: v as never })}>
            <SelectTrigger className="w-36" aria-label="Filter by priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSla} onValueChange={(v) => ui.setFilter({ filterSla: v as never })}>
            <SelectTrigger className="w-36" aria-label="Filter by SLA state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={ui.clearFilters}>
              <FilterX className="size-4" />
              Clear filters
            </Button>
          ) : null}
        </div>

        {view === 'table' && selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-accent/50 px-3 py-2">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Select onValueChange={(v) => handleBulkStatus(v as Status)}>
              <SelectTrigger className="h-8 w-40" aria-label="Bulk change status">
                <SelectValue placeholder="Change status…" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleBulkAssign}>
              <SelectTrigger className="h-8 w-44" aria-label="Bulk reassign">
                <SelectValue placeholder="Reassign to…" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {getUserName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={ui.clearSelected}>
              <X className="size-4" />
              Clear
            </Button>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={<FilterX className="size-5" />}
              title="No tickets match these filters"
              description="Try broadening your filters or clearing them to see the full queue."
              action={
                <Button variant="outline" size="sm" onClick={ui.clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState icon={<Inbox className="size-5" />} title="No tickets in this view" description="Nothing needs your attention here right now." />
          )
        ) : view === 'cards' ? (
          <TicketCards tickets={filtered} now={now} />
        ) : (
          <TicketTable
            tickets={filtered}
            now={now}
            selectable
            selectedIds={selectedIds}
            onToggle={ui.toggleSelected}
            onToggleAll={ui.selectAll}
          />
        )}
      </div>
    </AppShell>
  )
}
