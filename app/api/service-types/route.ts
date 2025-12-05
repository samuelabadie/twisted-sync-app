import { NextRequest, NextResponse } from 'next/server'
import { WebflowClient } from '../../../src/lib/webflow'
import axios from 'axios'

const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!
const TYPE_COLLECTION_ID = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!

// GET - List all service types
export async function GET() {
  try {
    const webflow = new WebflowClient(
      WEBFLOW_TOKEN,
      process.env.WEBFLOW_SITE_ID!
    )
    
    const serviceTypes = await webflow.getServiceTypes(TYPE_COLLECTION_ID)
    
    // Sort by name
    serviceTypes.sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json({ serviceTypes })
  } catch (error: any) {
    console.error('Error fetching service types:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper to create slug
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST - Create a new service type
export async function POST(request: NextRequest) {
  try {
    const { name, categoryIds = [] } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }
    
    const slug = toSlug(name)
    
    const headers = {
      Authorization: `Bearer ${WEBFLOW_TOKEN}`,
      'Content-Type': 'application/json',
    }
    
    // Create in Webflow
    const res = await axios.post(
      `https://api.webflow.com/v2/collections/${TYPE_COLLECTION_ID}/items/live`,
      {
        fieldData: {
          name: name.trim(),
          slug,
          service: [],
          categorie: categoryIds,
        },
      },
      { headers }
    )
    
    return NextResponse.json({ 
      success: true, 
      id: res.data.id,
      message: `Type "${name}" créé` 
    })
    
  } catch (error: any) {
    console.error('Error creating service type:', error.response?.data || error.message)
    return NextResponse.json({ error: error.response?.data?.message || error.message }, { status: 500 })
  }
}

// DELETE - Delete a service type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('id')
    
    if (!typeId) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
    }
    
    const headers = {
      Authorization: `Bearer ${WEBFLOW_TOKEN}`,
    }
    
    await axios.delete(
      `https://api.webflow.com/v2/collections/${TYPE_COLLECTION_ID}/items/${typeId}`,
      { headers }
    )
    
    return NextResponse.json({ success: true, message: 'Type supprimé' })
    
  } catch (error: any) {
    console.error('Error deleting service type:', error.response?.data || error.message)
    return NextResponse.json({ error: error.response?.data?.message || error.message }, { status: 500 })
  }
}
