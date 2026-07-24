import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Search, BookOpen, ThumbsUp } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader, EmptyState } from '@/components/page-header'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useData } from '@/lib/data'
import { ARTICLES } from '@/lib/seed-static'
import { getUserName } from '@/lib/lookups'
import type { Article } from '@/lib/types'

const ALL = 'all'

export default function KnowledgeBase() {
  const { data: articles } = useData<Article[]>('kb-articles', 'seed', ARTICLES)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const categories = useMemo(() => [ALL, ...Array.from(new Set((articles ?? []).map((a) => a.category)))], [articles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (articles ?? []).filter((a) => {
      if (category !== ALL && a.category !== category) return false
      if (!q) return true
      return `${a.title} ${a.body} ${a.tags.join(' ')}`.toLowerCase().includes(q)
    })
  }, [articles, query, category])

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageHeader title="Knowledge base" description="Self-service guides and how-tos for common IT tasks." />

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles…" className="pl-9" aria-label="Search knowledge base" />
        </div>

        <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
          <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors',
                  category === c ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                {c === ALL ? 'All categories' : c}
              </button>
            ))}
          </nav>

          {filtered.length === 0 ? (
            <EmptyState icon={<BookOpen className="size-5" />} title="No articles match your search" description="Try a different keyword or browse another category." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {filtered.map((a) => (
                <li key={a.id}>
                  <Link to={`/kb/${a.id}`} className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-accent/40">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.category} · {getUserName(a.authorId)} · Updated {format(new Date(a.updatedAt), 'MMM d')}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="size-3.5" />
                      {a.helpfulCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  )
}
