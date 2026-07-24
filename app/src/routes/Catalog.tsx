import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { Search, PackageOpen } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader, EmptyState } from '@/components/page-header'
import { RequestDrawer } from '@/components/request-drawer'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useData } from '@/lib/data'
import { CATALOG_ITEMS } from '@/lib/seed-static'
import { useUiStore } from '@/lib/store'
import type { CatalogItem } from '@/lib/types'

function CatalogIcon({ name }: { name: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Package
  return <Icon className="size-5 text-primary" />
}

export default function Catalog() {
  const { data: items } = useData<CatalogItem[]>('catalog-items', 'seed', CATALOG_ITEMS)
  const role = useUiStore((s) => s.role)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (items ?? []).filter((i) => !q || `${i.title} ${i.description} ${i.category}`.toLowerCase().includes(q))
  }, [items, query])

  function openItem(item: CatalogItem) {
    setSelected(item)
    setOpen(true)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageHeader title="Service catalog" description="Browse available IT services and submit a request. Requests land in the shared queue automatically." />

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-9" aria-label="Search catalog" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<PackageOpen className="size-5" />} title="No services match" description="Try a different search term to find the service you need." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Estimated fulfillment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    tabIndex={0}
                    onClick={() => openItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openItem(item)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary),transparent_88%)]">
                          <CatalogIcon name={item.icon} />
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{item.category}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{item.fulfillmentEstimate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <RequestDrawer item={selected} open={open} onOpenChange={setOpen} source={role === 'employee' ? 'portal' : 'catalog'} />
    </AppShell>
  )
}
