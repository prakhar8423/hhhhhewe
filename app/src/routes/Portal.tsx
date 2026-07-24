import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Plus, LifeBuoy, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader, EmptyState } from '@/components/page-header'
import { RequestDrawer } from '@/components/request-drawer'
import { StatusPill, TypeTag } from '@/components/pills'
import { Button } from '@/components/ui/button'
import { useDataStore, useUiStore } from '@/lib/store'
import { CATALOG_ITEMS } from '@/lib/seed-static'
import { OPEN_STATUSES } from '@/lib/types'
import type { CatalogItem } from '@/lib/types'

const FRIENDLY_SLA: Record<string, string> = {
  open: 'In progress with our team',
  done: 'Completed',
}

export default function Portal() {
  const tickets = useDataStore((s) => s.tickets)
  const currentUserId = useUiStore((s) => s.currentUserId)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [open, setOpen] = useState(false)

  const myRequests = useMemo(
    () =>
      tickets
        .filter((t) => t.requesterId === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tickets, currentUserId],
  )

  function startRequest() {
    setSelected(CATALOG_ITEMS[0])
    setOpen(true)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Help & requests"
          description="Track your open requests and raise something new with the IT service desk."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/kb">
                <BookOpen className="size-4" /> Browse help
              </Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading font-semibold">Need something from IT?</p>
            <p className="text-sm text-muted-foreground">Request hardware, access, software and more from the catalog.</p>
          </div>
          <Button asChild>
            <Link to="/catalog">
              <Plus className="size-4" /> New request
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold">My requests</h2>
          {myRequests.length === 0 ? (
            <EmptyState
              icon={<LifeBuoy className="size-5" />}
              title="You haven't raised any requests yet"
              description="When you submit a request from the catalog, you'll be able to track its progress here."
              action={
                <Button size="sm" onClick={startRequest}>
                  <Plus className="size-4" /> New request
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {myRequests.map((t) => (
                <li key={t.id}>
                  <Link to={`/tickets/${t.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/40">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <TypeTag type={t.type} />
                        <span className="truncate font-medium">{t.subject}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {FRIENDLY_SLA[OPEN_STATUSES.includes(t.status) ? 'open' : 'done']} · Raised{' '}
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusPill status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <RequestDrawer item={selected} open={open} onOpenChange={setOpen} source="portal" />
    </AppShell>
  )
}
