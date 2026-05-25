import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postUpdateSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/posts/[id] - Fetch detailed review post
export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        book: true,
        user: {
          select: { id: true, displayName: true, avatarUrl: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Gracefully handle deleted authors
    const authorName = post.user ? post.user.displayName : '<Người dùng đã bị xóa>'
    const authorAvatar = post.user ? post.user.avatarUrl : null

    return NextResponse.json({
      ...post,
      user: post.user ? {
        id: post.user.id,
        displayName: authorName,
        avatarUrl: authorAvatar
      } : null
    })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}

// PUT /api/posts/[id] - Update post review by author
export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Check ownership or admin privilege
    if (post.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. You are not the author of this post.' }, { status: 403 })
    }

    const body = await req.json()
    const result = postUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, contentMarkdown } = result.data

    // Intentional Business Tradeoff (feedback2.md):
    // Status is retained (still approved if it was approved) rather than being reset to 'pending'.
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(contentMarkdown !== undefined && { contentMarkdown }),
        updatedAt: new Date()
      },
      include: {
        book: true
      }
    })

    return NextResponse.json(updatedPost)
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - Delete post review by author or admin
export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Check ownership or admin privilege
    if (post.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. You cannot delete this post.' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
