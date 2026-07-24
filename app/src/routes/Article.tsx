import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, BookOpen, ThumbsUp } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/page-header'
import { ArticleBody } from '@/components/article-body'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { getArticle } from '@/lib/lookups'
import { getUserName } from '@/lib/lookups'

export default function Article() {
  const { id = '' } = useParams()
  const article = getArticle(id)
  const [helpful, setHelpful] = useState(false)

  if (!article) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl p-6">
          <EmptyState
            icon={<BookOpen className="size-5" />}
            title="Article not found"
            description="This article may have moved. Browse the knowledge base to find what you need."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/kb">Back to knowledge base</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    )
  }

  const related = article.relatedArticleIds.map(getArticle).filter(Boolean)

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <Link to="/kb" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Knowledge base
        </Link>

        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{article.category}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{article.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar userId={article.authorId} size="sm" />
            {getUserName(article.authorId)} · Updated {format(new Date(article.updatedAt), 'MMMM d, yyyy')}
          </div>
        </header>

        <ArticleBody body={article.body} />

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <span className="text-sm">Was this helpful?</span>
          <Button variant={helpful ? 'default' : 'outline'} size="sm" onClick={() => setHelpful((v) => !v)}>
            <ThumbsUp className="size-4" />
            {article.helpfulCount + (helpful ? 1 : 0)}
          </Button>
        </div>

        {related.length > 0 ? (
          <section className="space-y-2">
            <h2 className="font-heading text-sm font-semibold">Related articles</h2>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {related.map((r) => (
                <li key={r!.id}>
                  <Link to={`/kb/${r!.id}`} className="block p-3 text-sm font-medium transition-colors hover:bg-accent/40 hover:text-primary">
                    {r!.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}
