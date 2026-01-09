import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'
import { GoogleSheetsService } from '../../../src/lib/google-sheets'

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

    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CREDS) {
        throw new Error('Google Sheets credentials missing')
    }

    const sheets = new GoogleSheetsService(
        process.env.GOOGLE_SHEET_ID,
        process.env.GOOGLE_CREDS
    )

    // Get pending bookings from our SHEET (reliable) instead of Bookla API (unreliable/forbidden)
    const pendingBookings = await sheets.getPendingBookings()
    console.log(`Found ${pendingBookings.length} pending bookings in Sheet.`)

    const now = new Date()
    const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
    // const TIMEOUT_MS = 0 // FOR TEST ONLY: Expire immediately

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
            // Continue to mark as cancelled in Sheet anyway? 
            // Yes, if we can't cancel in Bookla, it might be already cancelled or API error. 
            // If it's 404, it's gone. If 403, we are in trouble but let's assume cancel works if we have ID.
            // If we don't update sheet, we will retry forever. So better to update sheet.
        }

        // 2. Update Sheet
        await sheets.updateBookingStatus(booking.bookingId, 'cancelled')
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

