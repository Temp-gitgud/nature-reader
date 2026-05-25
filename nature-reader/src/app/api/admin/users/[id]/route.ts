import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { adminUserUpdateSchema } from '@/lib/schemas/api.schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PUT /api/admin/users/[id] - Edit user profile and role by admin
export async function PUT(req: Request, context: RouteContext) {
  const { id: userId } = await context.params
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 })
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (!profile || profile.deletedAt) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const result = adminUserUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { role, displayName } = result.data

    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(role !== undefined && { role: role.toLowerCase() as any }), // match prisma enum UserRole casing
        ...(displayName !== undefined && { displayName }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'User updated successfully', profile: updatedProfile })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
