import { USERS } from '@/lib/seed-static'
import { ARTICLES } from '@/lib/seed-static'
import type { User } from '@/lib/types'

const USER_MAP = new Map<string, User>(USERS.map((u) => [u.id, u]))

export function getUser(id: string | null | undefined): User | undefined {
  if (!id) return undefined
  return USER_MAP.get(id)
}

export function getUserName(id: string | null | undefined): string {
  return getUser(id)?.name ?? 'Unassigned'
}

export function getArticle(id: string) {
  return ARTICLES.find((a) => a.id === id)
}
