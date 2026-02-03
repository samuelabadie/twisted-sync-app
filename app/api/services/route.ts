import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../src/lib/database'
import { BooklaClient } from '../../../src/lib/bookla'
import { WebflowClient } from '../../../src/lib/webflow'
import axios from 'axios'

// Default options for new services
const DEFAULT_OPTIONS = [
  {
    slug: 'coupe-des-pointes',
    name: 'Coupe des pointes',
    extraPrice: 10,
    extraDuration: 20,
    webflowOptionId: '7f5f3a59b25ca4006cac5a7f61f901d2'
  },
  {
    slug: 'shampoing-dmlant',
    name: 'Shampoing démêlant',
    extraPrice: 20,
    extraDuration: 20,
    webflowOptionId: '11b1b347018ca032452da6295b7a050b'
  },
  {
    slug: 'shampoing-et-soin',
    name: 'Shampoing et soin',
    extraPrice: 35,
    extraDuration: 40,
    webflowOptionId: '0c5cfab3d03f49c48d87cc188d136c30'
  },
]

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET - List all services grouped by parent
export async function GET() {
  try {
    const db = new DatabaseService()

    const allServices = await db.getServices()

    // Group services by parent (those without option_extra_slug)
    const grouped: any[] = []
    const parents = allServices.filter(s => !s.option_extra_slug)

    for (const parent of parents) {
      // Match options by checking if service name starts with parent name + " + "
      const parentName = parent.service_name.toLowerCase()
      const options = allServices.filter(s =>
        s.option_extra_slug &&
        s.service_name.toLowerCase().startsWith(parentName + ' + ')
      )

      const isFullySynced = Boolean(
        parent.bookla_service_id &&
        parent.webflow_id &&
        options.every(o => o.bookla_service_id && o.webflow_id)
      )

      grouped.push({
        slug: parent.webflow_slug || toSlug(parent.service_name),
        name: parent.service_name,
        price: parent.price_eur,
        duration: parent.duration_minutes,
        visible: parent.visible,
        parent: {
          ...parent,
          service_type: parent.service_type,
          service_type_id: parent.service_type_id,
        },
        options,
        isFullySynced,
      })
    }

    // Sort by name
    grouped.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ services: grouped })
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new service with options
export async function POST(request: NextRequest) {
  try {
    const { name, price, duration, bufferBefore = 15, bufferAfter = 15, serviceType, serviceTypeId, resources, selectedOptions } = await request.json()

    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json({ error: 'name, price, and duration are required' }, { status: 400 })
    }

    const db = new DatabaseService()
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!

    const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!)
    const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!)

    const baseSlug = toSlug(name)

    // Check if exists
    const allServices = await db.getServices()
    const existingService = allServices.find(s =>
      s.service_name.toLowerCase() === name.toLowerCase() ||
      s.webflow_slug === baseSlug
    )

    if (existingService) {
      return NextResponse.json({ error: `Le service "${name}" existe déjà` }, { status: 400 })
    }

    // Determine resources to associate
    let resourceIdsToLink = resources;

    if (!resourceIdsToLink || !Array.isArray(resourceIdsToLink) || resourceIdsToLink.length === 0) {
        console.log('No resources provided, fetching all resources as default...');
        const allResources = await bookla.getResources();
        resourceIdsToLink = allResources.map((r: any) => r.id);
    }

    console.log(`Associating ${resourceIdsToLink.length} resources to new service(s).`);

    const results: any[] = []
    let parentWebflowId = ''
    let parentBooklaId = ''

    // Create parent
    parentBooklaId = await bookla.createService({
      title: name,
      duration: duration,
      price: price,
      bufferBefore: bufferBefore,
      bufferAfter: bufferAfter,
      resources: resourceIdsToLink,
    })

    parentWebflowId = await webflow.createItem(collectionId, {
      name: name,
      slug: `svc-${baseSlug}`,
      prix: price,
      duree: duration,
      'bookla-id': parentBooklaId,
      'is-visible': true,
    })

    results.push({
      name,
      slug: baseSlug,
      price,
      duration,
      optionSlug: '',
      optionPrice: 0,
      optionDuration: 0,
      booklaId: parentBooklaId,
      webflowId: parentWebflowId,
      isParent: true,
    })

    // Filter options based on selection
    let optionsToCreate = DEFAULT_OPTIONS;
    if (selectedOptions && Array.isArray(selectedOptions)) {
        optionsToCreate = DEFAULT_OPTIONS.filter(opt => selectedOptions.includes(opt.slug));
    }

    console.log(`Creating ${optionsToCreate.length} options for service "${name}"`);

    // Create options
    for (const option of optionsToCreate) {
      const optionName = `${name} + ${option.name}`
      const optionPrice = price + option.extraPrice
      const optionDuration = duration + option.extraDuration
      const optionFullSlug = `${baseSlug}-${option.slug}`

      const booklaId = await bookla.createService({
        title: optionName,
        duration: optionDuration,
        price: optionPrice,
        bufferBefore: bufferBefore,
        bufferAfter: bufferAfter,
        resources: resourceIdsToLink,
      })

      const webflowId = await webflow.createItem(collectionId, {
        name: optionName,
        slug: `svc-${optionFullSlug}`,
        prix: optionPrice,
        duree: optionDuration,
        'bookla-id': booklaId,
        'is-visible': true,
        'service-parent': parentWebflowId,
        'option': option.webflowOptionId,
      })

      results.push({
        name: optionName,
        slug: optionFullSlug,
        price: optionPrice,
        duration: optionDuration,
        optionSlug: option.slug,
        optionPrice: option.extraPrice,
        optionDuration: option.extraDuration,
        booklaId,
        webflowId,
        isParent: false,
      })

      await new Promise(r => setTimeout(r, 300))
    }

    // Add parent service to service type if specified
    if (serviceTypeId && parentWebflowId) {
      try {
        const typeCollectionId = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!
        await webflow.addServiceToType(typeCollectionId, serviceTypeId, parentWebflowId)
        console.log(`Added service to type ${serviceType}`)
      } catch (e: any) {
        console.error('Error adding service to type:', e.message)
      }
    }

    // Add to Database
    for (const r of results) {
      await db.createService({
        webflow_id: r.webflowId,
        webflow_slug: r.slug,
        service_name: r.name,
        bookla_service_id: r.booklaId,
        duration_minutes: r.duration,
        price_eur: r.price,
        capacity_spots: 1,
        visible: true,
        option_extra_slug: r.optionSlug || undefined,
        option_extra_price: r.optionPrice || 0,
        option_extra_duration: r.optionDuration || 0,
        bookla_updated_at: new Date().toISOString(),
        service_type: r.isParent ? (serviceType || undefined) : undefined,
        service_type_id: r.isParent ? (serviceTypeId || undefined) : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Service "${name}" créé avec ${optionsToCreate.length} options${serviceType ? ` (Type: ${serviceType})` : ''}`,
      created: results.length
    })

  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a service and its options
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceName = searchParams.get('name')

    if (!serviceName) {
      return NextResponse.json({ error: 'name parameter is required' }, { status: 400 })
    }

    const db = new DatabaseService()
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!
    const token = process.env.WEBFLOW_API_TOKEN!
    const typeCollectionId = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!

    const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!)
    const webflow = new WebflowClient(token, process.env.WEBFLOW_SITE_ID!)

    const webflowApi = axios.create({
      baseURL: 'https://api.webflow.com/v2',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const baseSlug = toSlug(serviceName)

    // Find matching services (parent + options)
    const allServices = await db.getServices()
    const matchingServices = allServices.filter(s => {
      const rowName = s.service_name.toLowerCase()
      const rowSlug = s.webflow_slug?.toLowerCase() || ''

      const isParent = rowName === serviceName.toLowerCase() || rowSlug === baseSlug
      const isOption = rowName.startsWith(serviceName.toLowerCase() + ' + ') ||
                       rowSlug.startsWith(baseSlug + '-')

      return isParent || isOption
    })

    if (matchingServices.length === 0) {
      return NextResponse.json({ error: `Service "${serviceName}" non trouvé` }, { status: 404 })
    }

    // Find parent for service type removal
    const parent = matchingServices.find(s =>
      s.service_name.toLowerCase() === serviceName.toLowerCase() ||
      s.webflow_slug === baseSlug
    )

    // FIRST: Remove service from its type in Webflow (before deleting)
    if (parent?.webflow_id && parent?.service_type_id) {
      try {
        await webflow.removeServiceFromType(typeCollectionId, parent.service_type_id, parent.webflow_id)
        await new Promise(r => setTimeout(r, 1000))
      } catch (e: any) {
        console.error('Error removing service from type:', e.message)
      }
    }

    // Delete from Webflow (options first, parent last)
    const sortedForWebflow = [...matchingServices].sort((a, b) => {
      const aIsParent = a.service_name.toLowerCase() === serviceName.toLowerCase()
      const bIsParent = b.service_name.toLowerCase() === serviceName.toLowerCase()
      if (aIsParent && !bIsParent) return 1
      if (!aIsParent && bIsParent) return -1
      return 0
    })

    for (const service of sortedForWebflow) {
      if (service.webflow_id) {
        try {
          await webflowApi.delete(`/collections/${collectionId}/items/${service.webflow_id}`)
        } catch (e: any) {
          if (e.response?.status !== 404) console.error('Webflow delete error:', e.message)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // Delete from Bookla
    for (const service of matchingServices) {
      if (service.bookla_service_id) {
        try {
          await bookla.deleteService(service.bookla_service_id)
        } catch (e: any) {
          console.error('Bookla delete error:', e.message)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // Delete from Database
    for (const service of matchingServices) {
      await db.deleteService(service.rowIndex)
    }

    return NextResponse.json({
      success: true,
      message: `Service "${serviceName}" supprimé`,
      deleted: matchingServices.length
    })

  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update service visibility
export async function PATCH(request: NextRequest) {
  try {
    const { name, visible } = await request.json()

    if (!name || visible === undefined) {
      return NextResponse.json({ error: 'name and visible are required' }, { status: 400 })
    }

    const db = new DatabaseService()
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!

    const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!)

    // Find matching services (parent + options)
    const allServices = await db.getServices()
    const parentNameLower = name.toLowerCase()

    const matchingServices = allServices.filter(s => {
      const rowName = s.service_name.toLowerCase()
      const isParent = rowName === parentNameLower
      const isOption = rowName.startsWith(parentNameLower + ' + ')
      return isParent || isOption
    })

    if (matchingServices.length === 0) {
      return NextResponse.json({ error: `Service "${name}" non trouvé` }, { status: 404 })
    }

    let updatedCount = 0

    // Update Webflow items
    for (const service of matchingServices) {
      if (service.webflow_id) {
        try {
          await webflow.updateItem(collectionId, service.webflow_id, {
            'is-visible': visible,
          })
          updatedCount++
        } catch (e: any) {
          console.error(`Webflow update error for ${service.service_name}:`, e.message)
        }
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // Update Database
    for (const service of matchingServices) {
      await db.updateRow(service.rowIndex, { visible })
    }

    return NextResponse.json({
      success: true,
      message: `Visibilité mise à jour pour "${name}" et ses options`,
      updated: updatedCount,
      visible,
    })

  } catch (error: any) {
    console.error('Error updating visibility:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
