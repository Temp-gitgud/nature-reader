import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { commentCreateSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/posts/[id]/comments - Get paginated comments list
export async function GET(req: Request, context: RouteContext) {
  const { id: postId } = await context.params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10)))

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const skip = (page - 1) * pageSize
    const [comments, totalItems] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: post.id },
        include: {
          user: {
            select: { displayName: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.comment.count({ where: { postId: post.id } })
    ])

    // Format comments to handle deleted users gracefully (feedback2.md)
    const formattedComments = comments.map((comment: any) => {
      const authorName = comment.user ? comment.user.displayName : '<Người dùng đã bị xóa>'
      const authorAvatar = comment.user ? comment.user.avatarUrl : null
      return {
        ...comment,
        user: {
          displayName: authorName,
          avatarUrl: authorAvatar
        }
      }
    })

    const totalPages = Math.ceil(totalItems / pageSize)

    return NextResponse.json({
      comments: formattedComments,
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

// POST /api/posts/[id]/comments - Post a new comment
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
    const result = commentCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { content } = result.data

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: user.id,
        content
      },
      include: {
        user: {
          select: { displayName: true, avatarUrl: true }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
