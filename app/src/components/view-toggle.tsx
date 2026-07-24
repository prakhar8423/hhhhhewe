import { LayoutGrid, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const VIEW_MODES = ['cards', 'table'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

const OPTIONS = [
  { value: 'cards', label: 'Card view', icon: LayoutGrid },
  { value: 'table', label: 'Table view', icon: Rows3 },
] as const

export function ViewToggle({ view, onViewChange }: { view: ViewMode; onViewChange: (view: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-md border border-border bg-card p-0.5" role="group" aria-label="Layout">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onViewChange(opt.value)}
          aria-pressed={view === opt.value}
          aria-label={opt.label}
          className={cn(
            'flex size-8 items-center justify-center rounded transition-colors',
            view === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <opt.icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
