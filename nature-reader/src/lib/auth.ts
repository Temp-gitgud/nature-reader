import { supabase } from './supabase'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'admin'
  displayName: string
}

export async function getAuthenticatedUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return null
  }

  // Robustly extract the token.
  // Handles:
  // 1. "Bearer <token>" (standard)
  // 2. "<token>" (raw token without prefix)
  // 3. "Bearer Bearer <token>" (accidental double Bearer from Swagger UI)
  let token = authHeader.trim()
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim()
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim()
  }

  if (!token) return null

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }

    // Fetch the profile from public schema to get role and displayName
    const profile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    if (!profile || profile.deletedAt) {
      return null
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role.toLowerCase() as 'user' | 'admin',
      displayName: profile.displayName
    }
  } catch (err) {
    return null
  }
}
