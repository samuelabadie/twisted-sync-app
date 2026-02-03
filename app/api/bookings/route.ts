import { NextResponse } from 'next/server'
import { DatabaseService } from '../../../src/lib/database'

export async function GET() {
  try {
    const db = new DatabaseService()
    const bookings = await db.getAllBookings()

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
