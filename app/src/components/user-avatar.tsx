import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/lookups'

const SIZES = { sm: 'size-6 text-[0.6rem]', md: 'size-8 text-xs', lg: 'size-10 text-sm' } as const

export function UserAvatar({ userId, size = 'md', className }: { userId: string | null; size?: keyof typeof SIZES; className?: string }) {
  const user = getUser(userId)
  if (!user) {
    return (
      <Avatar className={cn(SIZES[size], className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">—</AvatarFallback>
      </Avatar>
    )
  }
  return (
    <Avatar className={cn(SIZES[size], className)}>
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.initials}
      </AvatarFallback>
    </Avatar>
  )
}
