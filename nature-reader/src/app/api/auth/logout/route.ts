import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: 'Logout success'
  })
}
