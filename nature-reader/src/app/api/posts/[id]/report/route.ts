import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportCreateSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/posts/[id]/report - Report a review post
export async function POST(req: Request, context: RouteContext) {
  const { id: postId } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const body = await req.json()
    const result = reportCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { reason, description } = result.data

    // Database unique index unique_post_report enforces 1 report/user/post (feedback2.md)
    const report = await prisma.postReport.create({
      data: {
        postId: post.id,
        reporterId: user.id,
        reason: reason.toLowerCase() as any, // match prisma enum ReportReason casing
        description: description || null,
        status: 'pending' // default status for review queue
      }
    })

    return NextResponse.json({ message: 'Report submitted successfully', report }, { status: 201 })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    // Catch unique constraint violation (P2002) - spam protection (feedback2.md)
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'You have already reported this post' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
