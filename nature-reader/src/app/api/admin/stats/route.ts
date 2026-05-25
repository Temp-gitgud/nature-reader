import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats - Website statistics for admin panel
export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 })
  }

  try {
    const [totalUsers, totalPosts, pendingPosts, totalReports, pendingReports] = await Promise.all([
      prisma.profile.count(),
      prisma.post.count(),
      prisma.post.count({ where: { status: 'pending' } }),
      prisma.postReport.count(),
      prisma.postReport.count({ where: { status: 'pending' } })
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPosts,
        pendingPosts,
        totalReports,
        pendingReports
      }
    })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
