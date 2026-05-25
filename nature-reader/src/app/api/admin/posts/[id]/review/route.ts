import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { adminPostReviewSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/posts/[id]/review - Approve or Reject review posts
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
    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const body = await req.json()
    const result = adminPostReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, rejectReason } = result.data

    // Perform inside a transaction to ensure audit log is written successfully
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 1. Update post status
      const updated = await tx.post.update({
        where: { id },
        data: {
          status: status.toLowerCase() as any, // match prisma enum PostStatus casing
          rejectReason: status === 'rejected' ? rejectReason : null,
          approvedBy: status === 'approved' ? user.id : null,
          approvedAt: status === 'approved' ? new Date() : null,
          updatedAt: new Date()
        }
      })

      // 2. Log the moderation action (ModerationLog) for audit trails
      await tx.moderationLog.create({
        data: {
          postId: post.id,
          adminId: user.id,
          action: status.toLowerCase() as any, // approved / rejected (match prisma enum ModerationAction)
          reason: status === 'rejected' ? rejectReason : 'Post approved'
        }
      })

      return updated
    })

    return NextResponse.json({ message: 'Post moderation completed successfully', post: updatedPost })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
