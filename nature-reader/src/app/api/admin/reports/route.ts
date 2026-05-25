import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports - Fetch moderation reports queue
export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10)))
  const status = searchParams.get('status') || 'pending' // 'pending', 'reviewed', 'action_taken', 'rejected'

  const where: any = {
    status: status.toLowerCase() as any
  }

  try {
    const skip = (page - 1) * pageSize
    const [reports, totalItems] = await Promise.all([
      prisma.postReport.findMany({
        where,
        include: {
          post: {
            select: { id: true, title: true }
          },
          reporter: {
            select: { displayName: true, email: true }
          },
          reviewer: {
            select: { displayName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.postReport.count({ where })
    ])

    const totalPages = Math.ceil(totalItems / pageSize)

    return NextResponse.json({
      reports,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
