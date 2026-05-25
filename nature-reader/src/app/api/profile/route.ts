import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { profileUpdateSchema } from '@/lib/schemas/api.schema'

// GET /api/profile - Fetch current profile
export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    if (!profile || profile.deletedAt) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}

// PUT /api/profile - Update current profile
export async function PUT(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = profileUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { displayName, bio, avatarUrl } = result.data

    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
