import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, CheckCircle2, Gauge, Trophy, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/page-header'
import { UserAvatar } from '@/components/user-avatar'
import { useDataStore } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import { rankAgents, formatMins } from '@/lib/agent-stats'
import type { AgentStats } from '@/lib/agent-stats'
import { cn } from '@/lib/utils'

const PODIUM_TONE = [
  'var(--chart-4)', // 1st
  'var(--chart-1)', // 2nd
  'var(--chart-3)', // 3rd
]

function PodiumCard({ agent, rank }: { agent: AgentStats; rank: number }) {
  const tone = PODIUM_TONE[rank]
  const isLead = rank === 0
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-center transition-transform hover:-translate-y-0.5',
        isLead && 'sm:-mt-4 sm:pb-8',
      )}
    >
      <div className="relative">
        <UserAvatar userId={agent.id} size="lg" />
        <span
          className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full text-xs font-bold text-white tabular-nums"
          style={{ backgroundColor: tone }}
        >
          {rank + 1}
        </span>
      </div>
      <div>
        <p className="font-heading font-semibold leading-tight text-balance">{agent.name}</p>
        <p className="text-xs text-muted-foreground">{agent.team}</p>
      </div>
      <p className="font-heading text-4xl font-semibold tabular-nums" style={{ color: tone }}>
        {agent.score}
      </p>
      <p className="text-xs text-muted-foreground">performance score</p>
      <div className="mt-1 grid w-full grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted px-2 py-1.5">
          <p className="font-semibold tabular-nums text-foreground">{agent.resolved}</p>
          <p className="text-muted-foreground">resolved</p>
        </div>
        <div className="rounded-md bg-muted px-2 py-1.5">
          <p className="font-semibold tabular-nums text-foreground">{agent.slaAttainment}%</p>
          <p className="text-muted-foreground">SLA met</p>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function TopAgents() {
  const tickets = useDataStore((s) => s.tickets)
  const now = useNow()

  const ranked = useMemo(() => rankAgents(tickets, now), [tickets, now])

  const totals = useMemo(() => {
    const totalResolved = ranked.reduce((sum, a) => sum + a.resolved, 0)
    const active = ranked.filter((a) => a.resolved > 0 || a.openLoad > 0)
    const avgSla =
      active.length === 0 ? 0 : Math.round(active.reduce((sum, a) => sum + a.slaAttainment, 0) / active.length)
    return { totalResolved, headcount: active.length, avgSla, top: ranked[0] }
  }, [ranked])

  const chartData = useMemo(
    () => ranked.slice(0, 8).map((a) => ({ name: a.name.split(' ')[0], resolved: a.resolved, color: a.avatarColor })),
    [ranked],
  )

  const podium = ranked.slice(0, 3)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Top performing agents"
          description="Ranked by a blend of resolved volume, SLA attainment, and first-response speed."
        />

        {ranked.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="No agent data yet"
            description="Once tickets are assigned and resolved, the leaderboard will rank your service desk team here."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Award className="size-5" />} label="Top performer" value={totals.top?.name.split(' ')[0] ?? '—'} />
              <Metric icon={<CheckCircle2 className="size-5" />} label="Total resolved" value={String(totals.totalResolved)} />
              <Metric icon={<Gauge className="size-5" />} label="Team SLA attainment" value={`${totals.avgSla}%`} />
              <Metric icon={<Users className="size-5" />} label="Active agents" value={String(totals.headcount)} />
            </div>

            <div className="grid items-end gap-4 sm:grid-cols-3">
              {[podium[1], podium[0], podium[2]]
                .map((a, displayIdx) => ({ agent: a, rank: displayIdx === 1 ? 0 : displayIdx === 0 ? 1 : 2 }))
                .filter((x) => x.agent)
                .map(({ agent, rank }) => (
                  <PodiumCard key={agent.id} agent={agent} rank={rank} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-muted-foreground" />
                  <h2 className="font-heading text-sm font-semibold">Full ranking</h2>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">#</th>
                        <th className="py-2 pr-3 font-medium">Agent</th>
                        <th className="py-2 pr-3 text-right font-medium tabular-nums">Resolved</th>
                        <th className="py-2 pr-3 text-right font-medium tabular-nums">Open</th>
                        <th className="py-2 pr-3 text-right font-medium tabular-nums">SLA</th>
                        <th className="py-2 pr-3 text-right font-medium tabular-nums">Avg response</th>
                        <th className="py-2 text-right font-medium tabular-nums">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.map((a, i) => (
                        <tr key={a.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/50">
                          <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar userId={a.id} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{a.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{a.team}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{a.resolved}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{a.openLoad}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{a.slaAttainment}%</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{formatMins(a.avgResponseMins)}</td>
                          <td className="py-2.5 text-right font-heading font-semibold tabular-nums">{a.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-heading text-sm font-semibold">Resolved by agent</h2>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={64} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'var(--muted)' }}
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                      />
                      <Bar dataKey="resolved" radius={[0, 4, 4, 0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
