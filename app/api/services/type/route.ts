import { NextRequest, NextResponse } from 'next/server'
import { WebflowClient } from '../../../../src/lib/webflow'
import { google } from 'googleapis'

// PATCH - Update a service's type
export async function PATCH(request: NextRequest) {
  try {
    const { serviceName, webflowId, oldTypeId, newTypeId, newTypeName } = await request.json()
    
    if (!serviceName || !webflowId) {
      return NextResponse.json({ error: 'serviceName and webflowId are required' }, { status: 400 })
    }
    
    const webflow = new WebflowClient(
      process.env.WEBFLOW_API_TOKEN!,
      process.env.WEBFLOW_SITE_ID!
    )
    const typeCollectionId = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!
    
    // Remove from old type if exists
    if (oldTypeId) {
      try {
        await webflow.removeServiceFromType(typeCollectionId, oldTypeId, webflowId)
        console.log(`Removed service from old type ${oldTypeId}`)
      } catch (e: any) {
        console.error('Error removing from old type:', e.message)
      }
    }
    
    // Add to new type if specified
    if (newTypeId) {
      try {
        await webflow.addServiceToType(typeCollectionId, newTypeId, webflowId)
        console.log(`Added service to new type ${newTypeId}`)
      } catch (e: any) {
        console.error('Error adding to new type:', e.message)
        return NextResponse.json({ error: 'Failed to add to new type' }, { status: 500 })
      }
    }
    
    // Update Google Sheet
    try {
      const sheetId = process.env.GOOGLE_SHEET_ID!
      const creds = JSON.parse(process.env.GOOGLE_CREDS!)
      
      const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      const sheetsApi = google.sheets({ version: 'v4', auth })
      
      // Find the row for this service
      const sheetData = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A2:S',
      })
      const rows = sheetData.data.values || []
      
      let rowIndex = -1
      for (let i = 0; i < rows.length; i++) {
        const rowName = rows[i][2] || ''
        if (rowName.toLowerCase() === serviceName.toLowerCase()) {
          rowIndex = i + 2 // +2 because we start at row 2
          break
        }
      }
      
      if (rowIndex > 0) {
        // Update columns R (17) and S (18) for Service_Type and Service_Type_ID
        await sheetsApi.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
              { range: `R${rowIndex}`, values: [[newTypeName || '']] },
              { range: `S${rowIndex}`, values: [[newTypeId || '']] },
            ],
          },
        })
        console.log(`Updated Sheet row ${rowIndex} with type ${newTypeName}`)
      }
    } catch (e: any) {
      console.error('Error updating Sheet:', e.message)
      // Don't fail the whole request if Sheet update fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: newTypeId 
        ? `Service "${serviceName}" ajouté au type "${newTypeName}"`
        : `Service "${serviceName}" retiré du type`
    })
    
  } catch (error: any) {
    console.error('Error updating service type:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
