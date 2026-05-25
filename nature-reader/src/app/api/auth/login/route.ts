import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { loginSchema } from '@/lib/schemas/auth.schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Validate request body against schema
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: result.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // 2. Log in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      user: data.user
    })

  } catch (err) {
    return NextResponse.json(
      { message: 'Invalid JSON request payload' },
      { status: 400 }
    )
  }
}
