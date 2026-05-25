import { NextResponse } from 'next/server'
import { getOpenApiDocument } from '@/lib/swagger/document'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getOpenApiDocument())
}
