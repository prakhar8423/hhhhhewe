import { Fragment, useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { Search, PackageOpen } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader, EmptyState } from '@/components/page-header'
import { RequestDrawer } from '@/components/request-drawer'
import { PriorityPill } from '@/components/pills'
import { ViewToggle } from '@/components/view-toggle'
import type { ViewMode } from '@/components/view-toggle'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useData } from '@/lib/data'
import { CATALOG_ITEMS } from '@/lib/seed-static'
import { useUiStore } from '@/lib/store'
import type { CatalogItem } from '@/lib/types'

type GroupedCatalog = [string, CatalogItem[]][]

function CatalogIcon({ name }: { name: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Package
  return <Icon className="size-5 text-primary" />
}

function CatalogCards({ grouped, onSelect }: { grouped: GroupedCatalog; onSelect: (item: CatalogItem) => void }) {
  return (
    <>
      {grouped.map(([category, catItems]) => (
        <section key={category} className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">{category}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary),transparent_88%)]">
                    <CatalogIcon name={item.icon} />
                  </span>
                  <span className="font-medium">{item.title}</span>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">{item.description}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <PriorityPill priority={item.defaultPriority} />
                  <span className="text-xs text-muted-foreground">{item.fulfillmentEstimate}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function CatalogTable({ grouped, onSelect }: { grouped: GroupedCatalog; onSelect: (item: CatalogItem) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Service</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden lg:table-cell">Priority</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grouped.map(([category, catItems]) => (
            <Fragment key={category}>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="bg-muted/40 py-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </TableCell>
              </TableRow>
              {catItems.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelect(item)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary),transparent_88%)]">
                        <CatalogIcon name={item.icon} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{item.title}</p>
                        <p className="max-w-md truncate text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{item.category}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <PriorityPill priority={item.defaultPriority} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{item.fulfillmentEstimate}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(item)
                      }}
                    >
                      Request
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function Catalog() {
  const { data: items } = useData<CatalogItem[]>('catalog-items', 'seed', CATALOG_ITEMS)
  const role = useUiStore((s) => s.role)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('cards')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [open, setOpen] = useState(false)

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (items ?? []).filter((i) => !q || `${i.title} ${i.description} ${i.category}`.toLowerCase().includes(q))
    const map = new Map<string, CatalogItem[]>()
    filtered.forEach((i) => {
      const list = map.get(i.category) ?? []
      list.push(i)
      map.set(i.category, list)
    })
    return [...map.entries()]
  }, [items, query])

  function openItem(item: CatalogItem) {
    setSelected(item)
    setOpen(true)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Service catalog"
          description="Browse available IT services and submit a request. Requests land in the shared queue automatically."
          actions={<ViewToggle view={view} onViewChange={setView} />}
        />

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-9" aria-label="Search catalog" />
        </div>

        {grouped.length === 0 ? (
          <EmptyState icon={<PackageOpen className="size-5" />} title="No services match" description="Try a different search term to find the service you need." />
        ) : view === 'cards' ? (
          <CatalogCards grouped={grouped} onSelect={openItem} />
        ) : (
          <CatalogTable grouped={grouped} onSelect={openItem} />
        )}
      </div>
      <RequestDrawer item={selected} open={open} onOpenChange={setOpen} source={role === 'employee' ? 'portal' : 'catalog'} />
    </AppShell>
  )
}
