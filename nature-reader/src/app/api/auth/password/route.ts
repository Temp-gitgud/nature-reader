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

    // Create a Supabase client bound to the user's specific access token
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // Set the user's access token
    const { error: sessionError } = await userClient.auth.setSession({
      access_token: token,
      refresh_token: ''
    })

    if (sessionError) {
      return NextResponse.json({ message: 'Authentication session failed', error: sessionError.message }, { status: 401 })
    }

    // Call Supabase updateUser to update password under user context
    const { error: updateError } = await userClient.auth.updateUser({ password })

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
