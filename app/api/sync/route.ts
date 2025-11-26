import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '../../../src/lib/google-sheets'
import { BooklaClient } from '../../../src/lib/bookla'
import { WebflowClient } from '../../../src/lib/webflow'

export async function POST(request: NextRequest) {
  try {
    const sheets = new GoogleSheetsService(
      process.env.GOOGLE_SHEET_ID!,
      process.env.GOOGLE_CREDS!
    )
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )
    const webflow = new WebflowClient(
      process.env.WEBFLOW_API_TOKEN!,
      process.env.WEBFLOW_SITE_ID!
    )
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!

    // 1. Read Sheet (source of truth)
    const sheetServices = await sheets.getServices()

    // 2. Pre-fetch Webflow items (indexed by bookla-id)
    await webflow.getAllItems(collectionId)

    // 3. Get Bookla services for validation
    const booklaServices = await bookla.getServices()
    const booklaServiceIds = new Set(booklaServices.map((s: any) => s.id))

    const report = {
      checked: 0,
      bookla_created: 0,
      webflow_created: 0,
      sheet_updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // 4. Process each service
    for (const service of sheetServices) {
      report.checked++
      const serviceName = service.service_name

      try {
        // === BOOKLA SYNC ===
        let booklaId = service.bookla_service_id

        if (booklaId && !booklaServiceIds.has(booklaId)) {
          // Bookla ID is stale
          booklaId = undefined
        }

        if (!booklaId) {
          // Create in Bookla
          booklaId = await bookla.createService({
            title: serviceName,
            duration: service.final_duration_min || service.duration_minutes,
            price: service.final_price || service.price_eur,
          })
          await sheets.updateRow(service.rowIndex, { bookla_service_id: booklaId })
          report.bookla_created++
          report.sheet_updated++
        }

        // === WEBFLOW SYNC ===
        let webflowId = service.webflow_id
        let webflowItem = null

        if (webflowId) {
          webflowItem = await webflow.getItemById(collectionId, webflowId)
          if (!webflowItem) webflowId = undefined
        }

        if (!webflowId) {
          webflowItem = await webflow.findItemByBooklaId(collectionId, booklaId)
          if (webflowItem) {
            webflowId = webflowItem.id
            await sheets.updateRow(service.rowIndex, { webflow_id: webflowId })
            report.sheet_updated++
          }
        }

        if (webflowId) {
          report.skipped++
        } else {
          // Create in Webflow
          const slug = service.webflow_slug || serviceName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          const webflowPayload = {
            name: serviceName,
            slug: `svc-${slug}`,
            prix: service.final_price || service.price_eur || 0,
            duree: service.final_duration_min || service.duration_minutes || 0,
            'bookla-id': booklaId,
            'is-visible': service.visible !== false,
          }

          try {
            const newWebflowId = await webflow.createItem(collectionId, webflowPayload)
            await sheets.updateRow(service.rowIndex, { webflow_id: newWebflowId })
            report.webflow_created++
            report.sheet_updated++
          } catch (err: any) {
            if (err.response?.status === 400) {
              // Slug conflict, try with suffix
              webflowPayload.slug = `svc-${slug}-${booklaId.slice(-6)}`
              const newWebflowId = await webflow.createItem(collectionId, webflowPayload)
              await sheets.updateRow(service.rowIndex, { webflow_id: newWebflowId })
              report.webflow_created++
              report.sheet_updated++
            } else {
              throw err
            }
          }
        }

      } catch (err: any) {
        report.errors.push(`${serviceName}: ${err.message}`)
      }
    }

    return NextResponse.json({
      message: 'Sync complete',
      summary: {
        checked: report.checked,
        bookla_created: report.bookla_created,
        webflow_created: report.webflow_created,
        sheet_updated: report.sheet_updated,
        skipped: report.skipped,
        errors_count: report.errors.length,
      },
      first_errors: report.errors.slice(0, 5),
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

