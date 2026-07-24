import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, CheckCircle2, Clock, Inbox } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/user-avatar'
import { SlaText } from '@/components/pills'
import { useDataStore } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import { OPEN_STATUSES, STATUS_LABEL, STATUSES, PRIORITY_LABEL, PRIORITIES } from '@/lib/types'
import { slaState, formatSlaCountdown } from '@/lib/sla'
import { breachWatchlist } from '@/lib/derive'
import { getUserName } from '@/lib/lookups'
import type { Priority } from '@/lib/types'

const CHART_TOKENS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const DAY_MS = 86400000
const TREND_DAYS = 14

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'default' | 'danger' | 'success' }) {
  const toneClass = tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-[var(--chart-2)]' : 'text-foreground'
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 font-heading text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      <div className="mt-4 h-56">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const tickets = useDataStore((s) => s.tickets)
  const events = useDataStore((s) => s.events)
  const now = useNow()

  const metrics = useMemo(() => {
    const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status))
    const breachedToday = tickets.filter(
      (t) => OPEN_STATUSES.includes(t.status) && slaState(t, now) === 'breached',
    ).length
    const weekAgo = now - 7 * DAY_MS
    const resolvedWeek = tickets.filter((t) => t.resolvedAt && new Date(t.resolvedAt).getTime() >= weekAgo).length
    const responded = tickets.filter((t) => t.firstRespondedAt)
    const avgResponseMins =
      responded.length === 0
        ? 0
        : Math.round(
            responded.reduce((sum, t) => sum + (new Date(t.firstRespondedAt!).getTime() - new Date(t.createdAt).getTime()) / 60000, 0) /
              responded.length,
          )
    return { openCount: open.length, breachedToday, resolvedWeek, avgResponseMins }
  }, [tickets, now])

  const statusData = useMemo(
    () =>
      STATUSES.filter((s) => s !== 'closed').map((s) => ({
        name: STATUS_LABEL[s],
        value: tickets.filter((t) => t.status === s).length,
      })),
    [tickets],
  )

  const statusTotal = useMemo(() => statusData.reduce((sum, s) => sum + s.value, 0), [statusData])

  const priorityData = useMemo(
    () =>
      PRIORITIES.map((p) => ({
        name: PRIORITY_LABEL[p].split(' · ')[0],
        priority: p as Priority,
        value: tickets.filter((t) => t.priority === p && OPEN_STATUSES.includes(t.status)).length,
      })).filter((d) => d.value > 0),
    [tickets],
  )

  const trendData = useMemo(() => {
    const days: { day: string; attainment: number }[] = []
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const dayStart = now - i * DAY_MS
      const resolvedThatDay = tickets.filter((t) => t.resolvedAt && Math.abs(new Date(t.resolvedAt).getTime() - dayStart) < DAY_MS)
      const met = resolvedThatDay.filter((t) => slaState(t, now) !== 'breached').length
      const attainment = resolvedThatDay.length === 0 ? 95 : Math.round((met / resolvedThatDay.length) * 100)
      days.push({ day: new Date(dayStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), attainment })
    }
    return days
  }, [tickets, now])

  const watchlist = useMemo(() => breachWatchlist(tickets, now), [tickets, now])
  const recent = useMemo(
    () => [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 7),
    [events],
  )

  const formatAvg = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <PageHeader title="Service desk overview" description="Live queue health, SLA attainment, and what needs attention right now." />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={<Inbox className="size-4" />} label="Open tickets" value={String(metrics.openCount)} />
          <Kpi icon={<AlertTriangle className="size-4" />} label="Breaching now" value={String(metrics.breachedToday)} tone="danger" />
          <Kpi icon={<Clock className="size-4" />} label="Avg first response" value={formatAvg(metrics.avgResponseMins)} />
          <Kpi icon={<CheckCircle2 className="size-4" />} label="Resolved this week" value={String(metrics.resolvedWeek)} tone="success" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
              <h2 className="font-heading text-sm font-semibold">Open tickets by status</h2>
              <div className="mt-4 flex flex-1 flex-col justify-center gap-4">
                {statusTotal === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No open tickets</div>
                ) : (
                  statusData.map((s, i) => {
                    const pct = Math.round((s.value / statusTotal) * 100)
                    const color = CHART_TOKENS[i % CHART_TOKENS.length]
                    return (
                      <div key={s.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            <span className="font-heading font-semibold text-foreground">{s.value}</span> · {pct}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          <ChartCard title="Open by priority">
            {priorityData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No open tickets</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={CHART_TOKENS[i % CHART_TOKENS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="SLA attainment — last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} interval={1} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
              />
              <Line type="monotone" dataKey="attainment" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Breach watchlist</h2>
              <Link to="/tickets" className="text-xs font-medium text-primary hover:underline">
                View queue
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {watchlist.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link to={`/tickets/${t.id}`} className="min-w-0">
                    <p className="truncate text-sm font-medium hover:text-primary">{t.subject}</p>
                    <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                  </Link>
                  <SlaText state={slaState(t, now)}>{formatSlaCountdown(t, now)}</SlaText>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-sm font-semibold">Recent activity</h2>
            <ul className="mt-3 space-y-3">
              {recent.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <UserAvatar userId={e.authorId} size="sm" />
                  <div className="min-w-0 text-sm">
                    <p className="text-pretty">
                      <span className="font-medium">{getUserName(e.authorId)}</span>{' '}
                      <span className="text-muted-foreground">{e.body.toLowerCase()}</span>{' '}
                      <Link to={`/tickets/${e.ticketId}`} className="font-mono text-xs text-primary hover:underline">
                        {e.ticketId}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
