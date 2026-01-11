import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'

export async function GET() {
  try {
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )
    
    const resources = await bookla.getResources()
    
    // Sort by name
    resources.sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    return NextResponse.json({ resources })
  } catch (error: any) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

