import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/account - Terminate account
export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Hard delete the profile row using Prisma
    // Database-level ON DELETE SET NULL will automatically nullify user_id in posts and comments
    await prisma.profile.delete({
      where: { id: user.id }
    })

    // Note: We cannot delete the auth.users record directly without service_role key,
    // but deleting the profiles record successfully terminates their application profile
    // and preserves all their posts/comments anonymously.

    return NextResponse.json({ message: 'Account terminated successfully' })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
