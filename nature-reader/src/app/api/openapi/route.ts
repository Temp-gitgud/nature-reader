import { NextResponse } from 'next/server'
import { getOpenApiDocument } from '@/lib/swagger/document'

export async function GET() {
  return NextResponse.json(getOpenApiDocument())
}
