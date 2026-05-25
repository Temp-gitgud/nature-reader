import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/posts/[id]/like - Like a review post
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

    // Try to create the like. Database unique index unique_post_like enforces 1 like/user/post
    await prisma.postLike.create({
      data: {
        userId: user.id,
        postId: post.id
      }
    })

    return NextResponse.json({ message: 'Post liked successfully' })
  } catch (err: any) {
    // Catch unique constraint violation (P2002)
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'You have already liked this post' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}

// DELETE /api/posts/[id]/like - Unlike a review post
export async function DELETE(req: Request, context: RouteContext) {
  const { id: postId } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const like = await prisma.postLike.findFirst({
      where: {
        userId: user.id,
        postId: postId
      }
    })

    if (!like) {
      return NextResponse.json({ message: 'You have not liked this post yet' }, { status: 400 })
    }

    await prisma.postLike.delete({
      where: { id: like.id }
    })

    return NextResponse.json({ message: 'Post unliked successfully' })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
