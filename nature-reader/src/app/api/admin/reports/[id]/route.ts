import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { adminReportReviewSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/reports/[id] - Handle / Resolve a report
export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 })
  }

  try {
    const report = await prisma.postReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 })
    }

    const body = await req.json()
    const result = adminReportReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, moderationNote } = result.data

    const updatedReport = await prisma.postReport.update({
      where: { id },
      data: {
        status: status.toLowerCase() as any, // match prisma enum ReportStatus casing
        moderationNote,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Report reviewed successfully', report: updatedReport })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
