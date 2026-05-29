import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { changePasswordSchema } from '@/lib/schemas/api.schema'

// PATCH /api/auth/password - Update password
export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.substring(7)

  try {
    const body = await req.json()
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { password } = result.data

    // Create a Supabase admin client to directly update the password safely under the authenticated user's ID
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Call admin.updateUserById to update the password directly for the authenticated user
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) {
      return NextResponse.json({ message: 'Password update failed', error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 })
  }
}
