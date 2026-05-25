import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postCreateSchema } from '@/lib/schemas/api.schema'

// GET /api/posts - List posts with pagination, filtering & sorting
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10', 10)))
  const filter = searchParams.get('filter') || 'approved' // 'approved' or 'own'
  const sort = searchParams.get('sort') || 'latest' // 'latest' or 'popular'

  let user = null
  if (filter === 'own') {
    user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized. Login required to view your own posts.' }, { status: 401 })
    }
  }

  // Build filters
  const where: any = {}
  if (filter === 'approved') {
    where.status = 'approved'
  } else if (filter === 'own' && user) {
    where.userId = user.id
  }

  // Build sorting
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'popular') {
    orderBy = {
      likes: {
        _count: 'desc'
      }
    }
  }

  try {
    const skip = (page - 1) * pageSize
    const [posts, totalItems] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          book: true,
          user: {
            select: { displayName: true, avatarUrl: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.post.count({ where })
    ])

    // Format posts to handle deleted users gracefully
    const formattedPosts = posts.map((post: any) => {
      const authorName = post.user ? post.user.displayName : '<Người dùng đã bị xóa>'
      const authorAvatar = post.user ? post.user.avatarUrl : null
      return {
        ...post,
        user: {
          displayName: authorName,
          avatarUrl: authorAvatar
        }
      }
    })

    const totalPages = Math.ceil(totalItems / pageSize)

    return NextResponse.json({
      posts: formattedPosts,
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

// POST /api/posts - Create a new review post
export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = postCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, contentMarkdown, bookTitle, bookAuthor, bookSummary, bookCoverUrl, publishedYear } = result.data

    // Normalize spacing and casing to reduce semantic duplicates (feedback2.md)
    const cleanBookTitle = bookTitle.trim().replace(/\s+/g, ' ')
    const cleanBookAuthor = bookAuthor.trim().replace(/\s+/g, ' ')

    // Case-insensitive query to find existing book
    let book = await prisma.book.findFirst({
      where: {
        title: { equals: cleanBookTitle, mode: 'insensitive' },
        author: { equals: cleanBookAuthor, mode: 'insensitive' }
      }
    })

    // If book does not exist, create a new one
    if (!book) {
      book = await prisma.book.create({
        data: {
          title: cleanBookTitle,
          author: cleanBookAuthor,
          summary: bookSummary || null,
          coverUrl: bookCoverUrl || null,
          publishedYear: publishedYear || null
        }
      })
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        bookId: book.id,
        title,
        contentMarkdown,
        status: 'pending' // default status for approval
      },
      include: {
        book: true
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
