import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'
import { DatabaseService } from '../../../src/lib/database'
import { withRetry } from '../../../src/utils/retry'
import { sendAlert } from '../../../src/utils/alerts'

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

    // Get pending bookings from our database (limited to 100 per run)
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

        try {
          // 1. Cancel in Bookla first (with retry)
          await withRetry(() => bookla.cancelBooking(booking.bookingId), { maxRetries: 2 })
          console.log('Cancelled in Bookla.')

          // 2. Only update DB if Bookla cancellation succeeded
          await db.updateBookingStatus(booking.bookingId, 'cancelled')
          cancelledCount++
        } catch (error: any) {
          console.error(`Failed to cancel booking ${booking.bookingId}: ${error.message}`)
          await sendAlert({
            subject: 'Cleanup: Bookla cancellation failed',
            context: `bookingId: ${booking.bookingId}, age: ${Math.round(age / 60000)}m`,
            error: error.message,
            route: '/api/cleanup-payments',
          })
          // Skip DB update -- booking stays pending, will be retried next cron run
        }
      }
    }

    console.log(`Cleanup complete. Cancelled ${cancelledCount} bookings.`)
    return NextResponse.json({ success: true, cancelled: cancelledCount })

  } catch (error: any) {
    console.error('Cleanup job failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
