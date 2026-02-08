import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../../src/lib/database'
import { BooklaClient } from '../../../../../src/lib/bookla'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getBookla() {
  return new BooklaClient(
    process.env.BOOKLA_API_KEY!,
    process.env.BOOKLA_COMPANY_ID!
  )
}

/** Get all Bookla service IDs for a parent service (parent + its options) */
async function getServiceAndOptionIds(db: DatabaseService, slug: string): Promise<string[]> {
  const allServices = await db.getServices()

  const parent = allServices.find(s =>
    !s.option_extra_slug &&
    (s.webflow_slug === slug || toSlug(s.service_name) === slug)
  )
  if (!parent) return []

  const parentNameLower = parent.service_name.toLowerCase()
  const options = allServices.filter(s =>
    s.option_extra_slug &&
    s.service_name.toLowerCase().startsWith(parentNameLower + ' + ')
  )

  const ids: string[] = []
  if (parent.bookla_service_id) ids.push(parent.bookla_service_id)
  for (const opt of options) {
    if (opt.bookla_service_id) ids.push(opt.bookla_service_id)
  }
  return ids
}

// GET - List linked/available resources for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const bookla = getBookla()
    const db = new DatabaseService()

    const allServices = await db.getServices()
    const parent = allServices.find(s =>
      !s.option_extra_slug &&
      (s.webflow_slug === slug || toSlug(s.service_name) === slug)
    )

    if (!parent || !parent.bookla_service_id) {
      return NextResponse.json({ error: `Service "${slug}" non trouvé` }, { status: 404 })
    }

    const linkedIds = await bookla.getServiceResourceLinks(parent.bookla_service_id)
    const allResources = await bookla.getResources()

    const linked = allResources
      .filter((r: any) => linkedIds.includes(r.id))
      .map((r: any) => ({ id: r.id, name: r.name, color: r.color }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const available = allResources
      .filter((r: any) => !linkedIds.includes(r.id))
      .map((r: any) => ({ id: r.id, name: r.name, color: r.color }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({ linked, available })
  } catch (error: any) {
    console.error('Error fetching service resources:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Link a resource to a service (+ cascade to options)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { resourceId } = await request.json()

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId requis' }, { status: 400 })
    }

    const bookla = getBookla()
    const db = new DatabaseService()

    const serviceIds = await getServiceAndOptionIds(db, slug)
    if (serviceIds.length === 0) {
      return NextResponse.json({ error: `Service "${slug}" non trouvé` }, { status: 404 })
    }

    for (const serviceId of serviceIds) {
      await bookla.linkResourceToService(serviceId, resourceId)
    }

    return NextResponse.json({
      success: true,
      message: `Ressource liée à ${serviceIds.length} service(s)`
    })
  } catch (error: any) {
    console.error('Error linking resource to service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Unlink a resource from a service (+ cascade to options)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId requis' }, { status: 400 })
    }

    const bookla = getBookla()
    const db = new DatabaseService()

    const serviceIds = await getServiceAndOptionIds(db, slug)
    if (serviceIds.length === 0) {
      return NextResponse.json({ error: `Service "${slug}" non trouvé` }, { status: 404 })
    }

    for (const serviceId of serviceIds) {
      await bookla.unlinkResourceFromService(serviceId, resourceId)
    }

    return NextResponse.json({
      success: true,
      message: `Ressource retirée de ${serviceIds.length} service(s)`
    })
  } catch (error: any) {
    console.error('Error unlinking resource from service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
