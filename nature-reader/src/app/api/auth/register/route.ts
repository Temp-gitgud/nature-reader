import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { registerSchema } from '@/lib/schemas/auth.schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Validate request body against schema
    const result = registerSchema.safeParse(body)

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

    // 2. Register user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Register success',
        user: data.user
      },
      { status: 201 }
    )

  } catch (err) {
    return NextResponse.json(
      { message: 'Invalid JSON request payload' },
      { status: 400 }
    )
  }
}
