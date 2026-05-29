import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { registerSchema } from '@/lib/schemas/auth.schema'
import { prisma } from '@/lib/prisma'

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

    const { email, password, displayName } = result.data

    // 2. Register user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    })

    if (error || !data.user) {
      return NextResponse.json(
        { message: error?.message || 'Failed to create user in Auth' },
        { status: 400 }
      )
    }

    // 3. Fail-safe: Ensure a corresponding profile exists in public.profiles.
    // If the database trigger did not run or failed, we create it manually.
    try {
      const existingProfile = await prisma.profile.findUnique({
        where: { id: data.user.id }
      })

      if (!existingProfile) {
        await prisma.profile.create({
          data: {
            id: data.user.id,
            email: email,
            displayName: displayName || email.split('@')[0],
            bio: "Thành viên yêu sách của Trạm Đọc Xanh.",
            role: email.toLowerCase().includes("admin") ? "admin" : "user",
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
          }
        })
      }
    } catch (dbErr: any) {
      console.error("Fail-safe profile creation failed or profile already exists:", dbErr.message)
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

