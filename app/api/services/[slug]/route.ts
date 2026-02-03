import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../src/lib/database'
import { BooklaClient } from '../../../../src/lib/bookla'
import { WebflowClient } from '../../../../src/lib/webflow'

// Default options for calculating option prices/durations
const DEFAULT_OPTIONS = [
  { slug: 'coupe-des-pointes', extraPrice: 10, extraDuration: 20 },
  { slug: 'shampoing-dmlant', extraPrice: 20, extraDuration: 20 },
  { slug: 'shampoing-et-soin', extraPrice: 35, extraDuration: 40 },
]

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// PUT - Update a service (price, duration, image, resources)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const {
      name,
      price,
      duration,
      imageUrl,
      resources // Array of resource IDs to link
    } = body

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const db = new DatabaseService()
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )
    const webflow = new WebflowClient(
      process.env.WEBFLOW_API_TOKEN!,
      process.env.WEBFLOW_SITE_ID!
    )

    const collectionId = process.env.WEBFLOW_COLLECTION_ID!

    // Get all services from Database
    const allServices = await db.getServices()

    // Find parent service by slug
    const parent = allServices.find(s =>
      !s.option_extra_slug &&
      (s.webflow_slug === slug || toSlug(s.service_name) === slug)
    )

    if (!parent) {
      return NextResponse.json({ error: `Service "${slug}" non trouvé` }, { status: 404 })
    }

    // Find related options
    const parentNameLower = parent.service_name.toLowerCase()
    const options = allServices.filter(s =>
      s.option_extra_slug &&
      s.service_name.toLowerCase().startsWith(parentNameLower + ' + ')
    )

    const updates: string[] = []

    // Calculate what changed
    const priceChanged = price !== undefined && price !== parent.price_eur
    const durationChanged = duration !== undefined && duration !== parent.duration_minutes
    const nameChanged = name !== undefined && name !== parent.service_name

    // 1. Update Database - Parent
    const parentDbUpdates: any = {}

    if (nameChanged) {
      parentDbUpdates.service_name = name
    }
    if (priceChanged) {
      parentDbUpdates.price_eur = price
    }
    if (durationChanged) {
      parentDbUpdates.duration_minutes = duration
    }
    if (imageUrl !== undefined) {
      parentDbUpdates.image_url = imageUrl
    }

    if (Object.keys(parentDbUpdates).length > 0) {
      parentDbUpdates.bookla_updated_at = new Date().toISOString()
      await db.updateRow(parent.rowIndex, parentDbUpdates)
      updates.push('Base de données parent mise à jour')
    }

    // 2. Update Bookla - Parent
    if (parent.bookla_service_id && (priceChanged || durationChanged || nameChanged)) {
      try {
        if (priceChanged) {
          await bookla.setServicePrice(parent.bookla_service_id, price)
          updates.push('Prix Bookla parent mis à jour')
        }
        if (durationChanged || nameChanged) {
          const booklaUpdate: any = {}
          if (durationChanged) booklaUpdate.duration = duration
          if (nameChanged) booklaUpdate.name = name
          await bookla.updateService(parent.bookla_service_id, booklaUpdate)
          updates.push('Bookla parent mis à jour')
        }
      } catch (e: any) {
        console.error('Error updating Bookla parent:', e.message)
      }
    }

    // 3. Update Webflow - Parent
    if (parent.webflow_id) {
      const webflowUpdates: any = {}

      if (nameChanged) {
        webflowUpdates.name = name
      }
      if (priceChanged) {
        webflowUpdates.prix = price
      }
      if (durationChanged) {
        webflowUpdates.duree = duration
      }
      if (imageUrl !== undefined) {
        webflowUpdates['image-principale'] = { url: imageUrl }
      }

      if (Object.keys(webflowUpdates).length > 0) {
        try {
          await webflow.updateItem(collectionId, parent.webflow_id, webflowUpdates)
          updates.push('Webflow parent mis à jour')
        } catch (e: any) {
          console.error('Error updating Webflow parent:', e.message)
        }
      }
    }

    // 4. Update Options if price or duration changed
    if ((priceChanged || durationChanged || nameChanged) && options.length > 0) {
      const newPrice = price ?? parent.price_eur
      const newDuration = duration ?? parent.duration_minutes
      const newName = name ?? parent.service_name

      for (const option of options) {
        // Find the option config
        const optionConfig = DEFAULT_OPTIONS.find(o => option.option_extra_slug === o.slug)
        if (!optionConfig) continue

        const optionPrice = newPrice + optionConfig.extraPrice
        const optionDuration = newDuration + optionConfig.extraDuration

        // Reconstruct option name if parent name changed
        let newOptionName = option.service_name
        if (nameChanged) {
          // Extract option suffix (e.g., " + Coupe des pointes")
          const oldPrefix = parent.service_name.toLowerCase()
          const currentNameLower = option.service_name.toLowerCase()
          if (currentNameLower.startsWith(oldPrefix + ' + ')) {
            const suffix = option.service_name.substring(parent.service_name.length)
            newOptionName = newName + suffix
          }
        }

        // Update Database
        const optionDbUpdates: any = {
          bookla_updated_at: new Date().toISOString(),
        }
        if (priceChanged) {
          optionDbUpdates.price_eur = optionPrice
        }
        if (durationChanged) {
          optionDbUpdates.duration_minutes = optionDuration
        }
        if (nameChanged) {
          optionDbUpdates.service_name = newOptionName
        }

        await db.updateRow(option.rowIndex, optionDbUpdates)

        // Update Bookla
        if (option.bookla_service_id) {
          try {
            if (priceChanged) {
              await bookla.setServicePrice(option.bookla_service_id, optionPrice)
            }
            if (durationChanged || nameChanged) {
              const booklaUpdate: any = {}
              if (durationChanged) booklaUpdate.duration = optionDuration
              if (nameChanged) booklaUpdate.name = newOptionName
              await bookla.updateService(option.bookla_service_id, booklaUpdate)
            }
          } catch (e: any) {
            console.error(`Error updating Bookla option ${option.service_name}:`, e.message)
          }
        }

        // Update Webflow
        if (option.webflow_id) {
          const webflowUpdates: any = {}
          if (priceChanged) webflowUpdates.prix = optionPrice
          if (durationChanged) webflowUpdates.duree = optionDuration
          if (nameChanged) webflowUpdates.name = newOptionName

          if (Object.keys(webflowUpdates).length > 0) {
            try {
              await webflow.updateItem(collectionId, option.webflow_id, webflowUpdates)
            } catch (e: any) {
              console.error(`Error updating Webflow option ${option.service_name}:`, e.message)
            }
          }
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 200))
      }

      updates.push(`${options.length} options mises à jour`)
    }

    // 5. Update Resources (employees) if provided
    if (resources !== undefined && Array.isArray(resources) && parent.bookla_service_id) {
      try {
        // Get current linked resources
        const currentResources = await bookla.getServiceResourceLinks(parent.bookla_service_id)

        // Find resources to unlink (in current but not in new)
        const toUnlink = currentResources.filter(r => !resources.includes(r))

        // Find resources to link (in new but not in current)
        const toLink = resources.filter(r => !currentResources.includes(r))

        // Unlink removed resources
        for (const resourceId of toUnlink) {
          await bookla.unlinkResourceFromService(parent.bookla_service_id, resourceId)
        }

        // Link new resources
        for (const resourceId of toLink) {
          await bookla.linkResourceToService(parent.bookla_service_id, resourceId)
        }

        // Also update options with the same resources
        for (const option of options) {
          if (option.bookla_service_id) {
            const optionCurrentResources = await bookla.getServiceResourceLinks(option.bookla_service_id)

            const optionToUnlink = optionCurrentResources.filter(r => !resources.includes(r))
            const optionToLink = resources.filter(r => !optionCurrentResources.includes(r))

            for (const resourceId of optionToUnlink) {
              await bookla.unlinkResourceFromService(option.bookla_service_id, resourceId)
            }
            for (const resourceId of optionToLink) {
              await bookla.linkResourceToService(option.bookla_service_id, resourceId)
            }
          }
        }

        if (toUnlink.length > 0 || toLink.length > 0) {
          updates.push(`Ressources mises à jour (${toLink.length} ajoutées, ${toUnlink.length} retirées)`)
        }
      } catch (e: any) {
        console.error('Error updating resources:', e.message)
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune modification détectée',
        updated: 0
      })
    }

    return NextResponse.json({
      success: true,
      message: `Service "${parent.service_name}" mis à jour`,
      details: updates,
      updated: 1 + options.length
    })

  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get a single service by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const db = new DatabaseService()
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    const allServices = await db.getServices()

    // Find parent service by slug
    const parent = allServices.find(s =>
      !s.option_extra_slug &&
      (s.webflow_slug === slug || toSlug(s.service_name) === slug)
    )

    if (!parent) {
      return NextResponse.json({ error: `Service "${slug}" non trouvé` }, { status: 404 })
    }

    // Find related options
    const parentNameLower = parent.service_name.toLowerCase()
    const options = allServices.filter(s =>
      s.option_extra_slug &&
      s.service_name.toLowerCase().startsWith(parentNameLower + ' + ')
    )

    // Get linked resources from Bookla
    let linkedResourceIds: string[] = []
    if (parent.bookla_service_id) {
      try {
        linkedResourceIds = await bookla.getServiceResourceLinks(parent.bookla_service_id)
      } catch (e) {
        console.error('Error fetching linked resources:', e)
      }
    }

    return NextResponse.json({
      service: {
        slug: parent.webflow_slug || toSlug(parent.service_name),
        name: parent.service_name,
        price: parent.price_eur,
        duration: parent.duration_minutes,
        visible: parent.visible,
        imageUrl: parent.image_url || '',
        serviceType: parent.service_type,
        serviceTypeId: parent.service_type_id,
        booklaId: parent.bookla_service_id,
        webflowId: parent.webflow_id,
        linkedResourceIds,
        options: options.map(o => ({
          name: o.service_name,
          price: o.price_eur,
          duration: o.duration_minutes,
          optionSlug: o.option_extra_slug,
        })),
      }
    })

  } catch (error: any) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
