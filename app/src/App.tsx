import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '@/routes/Login'
import ForgotPassword from '@/routes/ForgotPassword'
import UpdatePassword from '@/routes/UpdatePassword'
import Dashboard from '@/routes/Dashboard'
import TopAgents from '@/routes/TopAgents'
import Tickets from '@/routes/Tickets'
import TicketDetail from '@/routes/TicketDetail'
import Catalog from '@/routes/Catalog'
import KnowledgeBase from '@/routes/KnowledgeBase'
import Article from '@/routes/Article'
import Portal from '@/routes/Portal'

// BrowserRouter (clean URLs, no #). The mount path is never hardcoded here — the engine
// bakes it in as Vite's `base` (VITE_APP_BASE, see vite.config.ts) and the app reads it
// back as BASE_URL, so one value covers every slot it serves. A deploy build bakes '/'
// (the app's domain root → basename normalizes to undefined = root); a preview slot bakes
// its /agent-api/… path. The trailing slash goes because react-router rejects '/a/b'
// against basename '/a/b/'.
const APP_BASE = import.meta.env.BASE_URL
const basename = (APP_BASE.startsWith('/') ? APP_BASE.replace(/\/+$/, '') : '') || undefined

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/top-agents" element={<TopAgents />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/kb" element={<KnowledgeBase />} />
        <Route path="/kb/:id" element={<Article />} />
        <Route path="/portal" element={<Portal />} />
        <Route
          path="*"
          element={
            <main className="flex min-h-screen items-center justify-center">
              <p className="text-muted-foreground">Page not found.</p>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
