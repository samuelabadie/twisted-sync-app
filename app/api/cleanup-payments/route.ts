import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'

export async function GET(request: NextRequest) {
  // Optional: Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.BOOKLA_API_KEY || ''
  const companyId = process.env.BOOKLA_COMPANY_ID || ''
  
  // Debug: show first/last chars of API key to verify it's the right one
  console.log(`🔑 API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`)
  console.log(`🏢 Company ID: ${companyId}`)
  
  const bookla = new BooklaClient(apiKey, companyId)

  try {
    console.log('Starting payment cleanup job')

    const pendingBookings = await bookla.getPendingBookings()
    const now = new Date()
    const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

    let cancelledCount = 0

    for (const booking of pendingBookings) {
      const createdAt = new Date(booking.createdAt || booking.created_at)
      const age = now.getTime() - createdAt.getTime()

      if (age > TIMEOUT_MS) {
        console.log(`Cancelling expired booking ${booking.id} (age: ${Math.round(age / 60000)}m)`)
        await bookla.cancelBooking(booking.id)
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

