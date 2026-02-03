import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'
import { DatabaseService } from '../../../src/lib/database'

export async function GET(request: NextRequest) {
  // Allow execution via query param OR header
  const { searchParams } = new URL(request.url)
  const queryKey = searchParams.get('key')

  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && queryKey === cronSecret)

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookla = new BooklaClient(
    process.env.BOOKLA_API_KEY!,
    process.env.BOOKLA_COMPANY_ID!
  )

  try {
    console.log('Starting payment cleanup job')

    const db = new DatabaseService()

    // Get pending bookings from our database
    const pendingBookings = await db.getPendingBookings()
    console.log(`Found ${pendingBookings.length} pending bookings in database.`)

    const now = new Date()
    const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

    let cancelledCount = 0

    for (const booking of pendingBookings) {
      // Parse ISO date
      const createdAt = new Date(booking.createdAt)
      const age = now.getTime() - createdAt.getTime()

      if (age > TIMEOUT_MS) {
        console.log(`Cancelling expired booking ${booking.bookingId} (age: ${Math.round(age / 60000)}m)`)

        // 1. Cancel in Bookla
        try {
            await bookla.cancelBooking(booking.bookingId)
            console.log('Cancelled in Bookla.')
        } catch (booklaError: any) {
            console.error(`Failed to cancel in Bookla (maybe already cancelled?): ${booklaError.message}`)
        }

        // 2. Update Database
        await db.updateBookingStatus(booking.bookingId, 'cancelled')
        cancelledCount++
      }
    }

    console.log(`Cleanup complete. Cancelled ${cancelledCount} bookings.`)
    return NextResponse.json({ success: true, cancelled: cancelledCount })

  } catch (error: any) {
    console.error('Cleanup job failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
