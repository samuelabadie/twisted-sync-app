import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '../../../src/lib/google-sheets'
import { BooklaClient } from '../../../src/lib/bookla'
import { WebflowClient } from '../../../src/lib/webflow'
import { google } from 'googleapis'
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
    const sheets = new GoogleSheetsService(
      process.env.GOOGLE_SHEET_ID!,
      process.env.GOOGLE_CREDS!
    )
    
    const allServices = await sheets.getServices()
    
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
    const { name, price, duration, bufferBefore = 15, bufferAfter = 15, serviceType, serviceTypeId, resources } = await request.json()
    
    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json({ error: 'name, price, and duration are required' }, { status: 400 })
    }
    
    const sheetId = process.env.GOOGLE_SHEET_ID!
    const creds = JSON.parse(process.env.GOOGLE_CREDS!)
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!
    
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheetsApi = google.sheets({ version: 'v4', auth })
    const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!)
    const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!)
    
    const baseSlug = toSlug(name)
    
    // Check if exists
    const sheetData = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:Q',
    })
    const rows = sheetData.data.values || []
    const existingRow = rows.find((row: any[]) => {
      const rowName = row[2]?.toLowerCase()
      const rowSlug = row[1]?.toLowerCase()
      return rowName === name.toLowerCase() || rowSlug === baseSlug
    })
    
    if (existingRow) {
      return NextResponse.json({ error: `Le service "${name}" existe déjà` }, { status: 400 })
    }

    // Determine resources to associate
    // If provided in payload, use them. Otherwise fetch all (fallback/legacy behavior)
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
      resources: resourceIdsToLink, // Pass explicit list
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
      optionPrice: '',
      optionDuration: '',
      booklaId: parentBooklaId,
      webflowId: parentWebflowId,
    })
    
    // Create options
    for (const option of DEFAULT_OPTIONS) {
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
        resources: resourceIdsToLink, // Pass explicit list
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
        price,
        duration,
        optionSlug: option.slug,
        optionPrice: option.extraPrice,
        optionDuration: option.extraDuration,
        booklaId,
        webflowId,
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
        // Don't fail the whole request, just log the error
      }
    }
    
    // Add to Sheet (now with Service_Type columns R and S)
    const newRows = results.map((r, idx) => [
      r.webflowId,
      r.slug,
      r.name,
      r.booklaId,
      r.duration,
      r.price,
      '', '', '', '',
      '1',
      'TRUE',
      r.optionSlug,
      r.optionPrice || '',
      r.optionDuration || '',
      new Date().toISOString(),
      '',
      idx === 0 ? (serviceType || '') : '',      // Service_Type (only for parent)
      idx === 0 ? (serviceTypeId || '') : '',    // Service_Type_ID (only for parent)
    ])
    
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:S',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newRows },
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `Service "${name}" créé avec ${DEFAULT_OPTIONS.length} options${serviceType ? ` (Type: ${serviceType})` : ''}`,
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
    
    const sheetId = process.env.GOOGLE_SHEET_ID!
    const creds = JSON.parse(process.env.GOOGLE_CREDS!)
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!
    const token = process.env.WEBFLOW_API_TOKEN!
    const typeCollectionId = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!
    
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheetsApi = google.sheets({ version: 'v4', auth })
    const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!)
    const webflow = new WebflowClient(token, process.env.WEBFLOW_SITE_ID!)
    
    const webflowApi = axios.create({
      baseURL: 'https://api.webflow.com/v2',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const baseSlug = toSlug(serviceName)
    
    // Find matching rows (now reading up to column S for service_type_id)
    const sheetData = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:S',
    })
    const rows = sheetData.data.values || []
    
    const matchingRows: { rowIndex: number; data: any[] }[] = []
    let parentWebflowId: string | null = null
    let parentTypeId: string | null = null
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowName = row[2]?.toLowerCase() || ''
      const rowSlug = row[1]?.toLowerCase() || ''
      
      const isParent = rowName === serviceName.toLowerCase() || rowSlug === baseSlug
      const isOption = rowName.startsWith(serviceName.toLowerCase() + ' + ') || 
                       rowSlug.startsWith(baseSlug + '-')
      
      if (isParent || isOption) {
        matchingRows.push({ rowIndex: i + 2, data: row })
        
        // Get parent's webflow_id and service_type_id
        if (isParent) {
          parentWebflowId = row[0] || null  // Column A = Webflow_ID
          parentTypeId = row[18] || null    // Column S = Service_Type_ID
        }
      }
    }
    
    if (matchingRows.length === 0) {
      return NextResponse.json({ error: `Service "${serviceName}" non trouvé` }, { status: 404 })
    }
    
    const booklaIdsToDelete = new Set(matchingRows.map(r => r.data[3]).filter(Boolean))
    
    // FIRST: Remove service from its type in Webflow (before deleting)
    if (parentWebflowId && parentTypeId) {
      try {
        await webflow.removeServiceFromType(typeCollectionId, parentTypeId, parentWebflowId)
        // Wait for Webflow to process the reference removal
        await new Promise(r => setTimeout(r, 1000))
      } catch (e: any) {
        console.error('Error removing service from type:', e.message)
        // Continue with deletion even if this fails
      }
    }
    
    // Delete from Webflow (options first, parent last)
    const sortedForWebflow = [...matchingRows].sort((a, b) => {
      const aIsParent = a.data[2]?.toLowerCase() === serviceName.toLowerCase()
      const bIsParent = b.data[2]?.toLowerCase() === serviceName.toLowerCase()
      if (aIsParent && !bIsParent) return 1
      if (!aIsParent && bIsParent) return -1
      return 0
    })
    
    for (const row of sortedForWebflow) {
      const webflowId = row.data[0]
      if (webflowId) {
        try {
          await webflowApi.delete(`/collections/${collectionId}/items/${webflowId}`)
        } catch (e: any) {
          if (e.response?.status !== 404) console.error('Webflow delete error:', e.message)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    }
    
    // Delete from Bookla
    for (const row of matchingRows) {
      const booklaId = row.data[3]
      if (booklaId) {
        try {
          await bookla.deleteService(booklaId)
        } catch (e: any) {
          console.error('Bookla delete error:', e.message)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    }
    
    // Delete from Sheet
    const spreadsheet = await sheetsApi.spreadsheets.get({ spreadsheetId: sheetId })
    const actualSheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0
    
    const freshSheetData = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:Q',
    })
    const freshRows = freshSheetData.data.values || []
    
    const rowsToDelete: number[] = []
    for (let i = 0; i < freshRows.length; i++) {
      const booklaId = freshRows[i][3]
      if (booklaId && booklaIdsToDelete.has(booklaId)) {
        rowsToDelete.push(i + 2)
      }
    }
    
    const sortedRowsDesc = rowsToDelete.sort((a, b) => b - a)
    for (const rowIndex of sortedRowsDesc) {
      try {
        await sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: actualSheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                }
              }
            }]
          }
        })
      } catch (e: any) {
        console.error('Sheet delete error:', e.message)
      }
      await new Promise(r => setTimeout(r, 200))
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Service "${serviceName}" supprimé`,
      deleted: matchingRows.length 
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
    
    const sheetId = process.env.GOOGLE_SHEET_ID!
    const creds = JSON.parse(process.env.GOOGLE_CREDS!)
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!
    
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheetsApi = google.sheets({ version: 'v4', auth })
    const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!)
    
    // Find matching rows (parent + options)
    const sheetData = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:Q',
    })
    const rows = sheetData.data.values || []
    
    const matchingRows: { rowIndex: number; data: any[] }[] = []
    const parentNameLower = name.toLowerCase()
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowName = row[2]?.toLowerCase() || ''
      
      // Match parent or options (parent name + " + ")
      const isParent = rowName === parentNameLower
      const isOption = rowName.startsWith(parentNameLower + ' + ')
      
      if (isParent || isOption) {
        matchingRows.push({ rowIndex: i + 2, data: row })
      }
    }
    
    if (matchingRows.length === 0) {
      return NextResponse.json({ error: `Service "${name}" non trouvé` }, { status: 404 })
    }
    
    let updatedCount = 0
    
    // Update Webflow items
    for (const row of matchingRows) {
      const webflowId = row.data[0]
      if (webflowId) {
        try {
          await webflow.updateItem(collectionId, webflowId, {
            'is-visible': visible,
          })
          updatedCount++
        } catch (e: any) {
          console.error(`Webflow update error for ${row.data[2]}:`, e.message)
        }
        await new Promise(r => setTimeout(r, 200))
      }
    }
    
    // Update Sheet (column L = index 11 = Visible)
    const updates = matchingRows.map(row => ({
      range: `L${row.rowIndex}`,
      values: [[visible ? 'TRUE' : 'FALSE']],
    }))
    
    if (updates.length > 0) {
      await sheetsApi.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      })
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

