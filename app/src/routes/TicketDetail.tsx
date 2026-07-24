import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Lock, MessageSquare } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/page-header'
import { StatusPill, PriorityPill, SlaText, TypeTag } from '@/components/pills'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useDataStore, useUiStore } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import { getUserName, getArticle } from '@/lib/lookups'
import { slaState, formatSlaCountdown } from '@/lib/sla'
import { STATUSES, PRIORITIES, STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types'
import { AGENT_IDS } from '@/lib/seed-static'
import { cn } from '@/lib/utils'
import type { Status, TicketEvent } from '@/lib/types'

const RESOLVING: Status[] = ['resolved', 'closed']

function EventRow({ event }: { event: TicketEvent }) {
  const isNote = event.kind === 'internal_note'
  const isSystem = ['status_change', 'assignment', 'priority_change', 'created', 'resolved', 'worklog'].includes(event.kind)

  if (isSystem) {
    return (
      <li className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
        <span className="size-1.5 shrink-0 rounded-full bg-border" />
        <span>
          <span className="font-medium text-foreground">{getUserName(event.authorId)}</span> {event.body.toLowerCase()}
          {event.meta?.to && event.kind !== 'created' ? (
            <>
              {' → '}
              <span className="font-medium text-foreground">
                {event.kind === 'assignment' ? getUserName(event.meta.to) : STATUS_LABEL[event.meta.to as Status] ?? PRIORITY_LABEL[event.meta.to as never] ?? event.meta.to}
              </span>
            </>
          ) : null}
        </span>
        <span className="ml-auto text-xs">{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
      </li>
    )
  }

  return (
    <li className={cn('rounded-lg border p-3', isNote ? 'border-[color-mix(in_srgb,var(--chart-4),transparent_70%)] bg-[color-mix(in_srgb,var(--chart-4),transparent_92%)]' : 'border-border bg-card')}>
      <div className="flex items-center gap-2">
        <UserAvatar userId={event.authorId} size="sm" />
        <span className="text-sm font-medium">{getUserName(event.authorId)}</span>
        {isNote ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--chart-4)]">
            <Lock className="size-3" /> Internal note
          </span>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
      </div>
      <p className="mt-2 text-sm text-pretty">{event.body}</p>
    </li>
  )
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default function TicketDetail() {
  const { id = '' } = useParams()
  const ticket = useDataStore((s) => s.tickets.find((t) => t.id === id))
  const events = useDataStore((s) => s.events)
  const addEvent = useDataStore((s) => s.addEvent)
  const setStatus = useDataStore((s) => s.setStatus)
  const setPriority = useDataStore((s) => s.setPriority)
  const setAssignee = useDataStore((s) => s.setAssignee)
  const currentUserId = useUiStore((s) => s.currentUserId)
  const now = useNow()

  const [reply, setReply] = useState('')
  const [composerTab, setComposerTab] = useState('reply')

  const timeline = useMemo(
    () => events.filter((e) => e.ticketId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [events, id],
  )

  if (!ticket) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl p-6">
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="Ticket not found"
            description="This ticket may have been removed or the link is incorrect."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/tickets">Back to queue</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    )
  }

  function handlePost() {
    if (!ticket || !reply.trim()) return
    addEvent(ticket.id, composerTab === 'note' ? 'internal_note' : 'comment', currentUserId, reply.trim())
    setReply('')
    toast.success(composerTab === 'note' ? 'Internal note added' : 'Reply posted')
  }

  function handleStatus(next: Status) {
    if (!ticket) return
    if (RESOLVING.includes(next)) {
      const note = window.prompt('Add a resolution note:', 'Issue resolved and verified with the requester.')
      if (note === null) return
      setStatus(ticket.id, next, currentUserId, note)
    } else {
      setStatus(ticket.id, next, currentUserId)
    }
    toast.success(`Status set to ${STATUS_LABEL[next]}`)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to queue
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TypeTag type={ticket.type} />
                <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
              </div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{ticket.subject}</h1>
              <p className="max-w-prose whitespace-pre-line text-sm text-muted-foreground text-pretty">{ticket.description}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <Tabs value={composerTab} onValueChange={setComposerTab}>
                <TabsList>
                  <TabsTrigger value="reply">Public reply</TabsTrigger>
                  <TabsTrigger value="note">Internal note</TabsTrigger>
                </TabsList>
                <TabsContent value="reply" className="mt-3">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply to the requester…" aria-label="Public reply" />
                </TabsContent>
                <TabsContent value="note" className="mt-3">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add an internal note (not visible to the requester)…" aria-label="Internal note" />
                </TabsContent>
              </Tabs>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handlePost} disabled={!reply.trim()}>
                  {composerTab === 'note' ? 'Add note' : 'Post reply'}
                </Button>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-sm font-semibold">Activity</h2>
              <ul className="mt-3 space-y-2">
                {timeline.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-heading text-sm font-semibold">Properties</h2>
              <div className="mt-1 divide-y divide-border">
                <PropertyRow label="SLA">
                  <SlaText state={slaState(ticket, now)}>{formatSlaCountdown(ticket, now)}</SlaText>
                </PropertyRow>
                <PropertyRow label="Status">
                  <Select value={ticket.status} onValueChange={(v) => handleStatus(v as Status)}>
                    <SelectTrigger className="h-8 w-36 border-0 bg-transparent px-0 shadow-none focus:ring-0" aria-label="Change status">
                      <StatusPill status={ticket.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>
                <PropertyRow label="Priority">
                  <Select value={ticket.priority} onValueChange={(v) => { setPriority(ticket.id, v as never, currentUserId); toast.success(`Priority set to ${PRIORITY_LABEL[v as never]}`) }}>
                    <SelectTrigger className="h-8 w-32 border-0 bg-transparent px-0 shadow-none focus:ring-0" aria-label="Change priority">
                      <PriorityPill priority={ticket.priority} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>
                <PropertyRow label="Assignee">
                  <Select value={ticket.assigneeId ?? 'unassigned'} onValueChange={(v) => { setAssignee(ticket.id, v === 'unassigned' ? null : v, currentUserId); toast.success('Assignee updated') }}>
                    <SelectTrigger className="h-8 w-40" aria-label="Reassign ticket">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {AGENT_IDS.map((aid) => (
                        <SelectItem key={aid} value={aid}>
                          {getUserName(aid)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>
                <PropertyRow label="Requester">{getUserName(ticket.requesterId)}</PropertyRow>
                <PropertyRow label="Category">{ticket.category}</PropertyRow>
                <PropertyRow label="Created">{format(new Date(ticket.createdAt), 'MMM d, HH:mm')}</PropertyRow>
              </div>
            </div>

            {ticket.linkedArticleIds.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-heading text-sm font-semibold">Linked articles</h2>
                <div className="mt-2 space-y-1">
                  {ticket.linkedArticleIds.map((aid) => {
                    const article = getArticle(aid)
                    if (!article) return null
                    return (
                      <Link key={aid} to={`/kb/${aid}`} className="block text-sm text-primary hover:underline">
                        {article.title}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {ticket.resolutionNote && RESOLVING.includes(ticket.status) ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-heading text-sm font-semibold">Resolution</h2>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground text-pretty">{ticket.resolutionNote}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
