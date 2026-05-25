import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id }
    })

    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 })
    }

    // Check ownership or admin privilege
    if (comment.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. You cannot delete this comment.' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
