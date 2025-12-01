import { NextResponse } from 'next/server'
import axios from 'axios'

const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!
const CATEGORY_COLLECTION_ID = process.env.WEBFLOW_CATEGORY_COLLECTION_ID!

// GET - List all categories (homme/femme)
export async function GET() {
  try {
    const headers = {
      Authorization: `Bearer ${WEBFLOW_TOKEN}`,
    }
    
    const res = await axios.get(
      `https://api.webflow.com/v2/collections/${CATEGORY_COLLECTION_ID}/items`,
      { headers }
    )
    
    const categories = (res.data.items || []).map((item: any) => ({
      id: item.id,
      name: item.fieldData?.name || '',
      slug: item.fieldData?.slug || '',
    }))
    
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error fetching categories:', error.response?.data || error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
