export const userRoles = ['creator', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

export type PublicUser = {
  id: string
  email: string
  handle: string
  displayName: string
  role: UserRole
  bio: string
  avatarUrl?: string | null
  createdAt: string
}

export type WorkStatus = 'draft' | 'published' | 'archived'
