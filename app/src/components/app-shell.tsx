import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  LayoutGrid,
  BookOpen,
  LifeBuoy,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/lib/store'
import { UserAvatar } from '@/components/user-avatar'
import { getUser } from '@/lib/lookups'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const AGENT_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/catalog', label: 'Service Catalog', icon: LayoutGrid },
  { to: '/kb', label: 'Knowledge Base', icon: BookOpen },
  { to: '/portal', label: 'Employee Portal', icon: LifeBuoy },
]

const EMPLOYEE_NAV = [
  { to: '/portal', label: 'My Requests', icon: LifeBuoy, end: true },
  { to: '/catalog', label: 'Request Something', icon: LayoutGrid },
  { to: '/kb', label: 'Knowledge Base', icon: BookOpen },
]

function useThemeSync() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const role = useUiStore((s) => s.role)
  const items = role === 'agent' ? AGENT_NAV : EMPLOYEE_NAV
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <LifeBuoy className="size-4.5" />
        </div>
        <span className="font-heading text-lg font-semibold text-sidebar-foreground">Meridian</span>
      </div>
      <NavItems onNavigate={onNavigate} />
    </div>
  )
}

function RoleSwitch() {
  const role = useUiStore((s) => s.role)
  const setRole = useUiStore((s) => s.setRole)
  const navigate = useNavigate()
  return (
    <div className="flex items-center rounded-md border border-border bg-card p-0.5 text-xs font-medium">
      {(['agent', 'employee'] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => {
            setRole(r)
            navigate(r === 'agent' ? '/' : '/portal')
          }}
          className={cn(
            'rounded px-2.5 py-1 capitalize transition-colors',
            role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const currentUserId = useUiStore((s) => s.currentUserId)
  const setSearch = useUiStore((s) => s.setSearch)
  const [localSearch, setLocalSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser(currentUserId)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(localSearch)
    if (!location.pathname.startsWith('/tickets')) navigate('/tickets')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search tickets by ID, subject, requester…"
          className="pl-9"
          aria-label="Global ticket search"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <RoleSwitch />
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <UserAvatar userId={currentUserId} size="sm" />
          <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useThemeSync()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
