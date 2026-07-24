import { useEffect, useState } from 'react'

const TICK_MS = 60000

/** Returns a timestamp that refreshes every minute, for live SLA countdowns. */
export function useNow(intervalMs: number = TICK_MS): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
