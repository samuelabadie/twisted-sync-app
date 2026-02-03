import { NextRequest, NextResponse } from 'next/server'
import { BooklaClient } from '../../../src/lib/bookla'

// GET - List all employees/resources
export async function GET() {
  try {
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    const resources = await bookla.getResources()

    return NextResponse.json({
      employees: resources.map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        type: r.type,
      }))
    })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    const resourceId = await bookla.createResource(name, color)

    return NextResponse.json({
      success: true,
      message: `Employé "${name}" créé`,
      employee: {
        id: resourceId,
        name,
        color,
      }
    })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete an employee
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('id')

    if (!employeeId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    await bookla.deleteResource(employeeId)

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé'
    })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update an employee
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, color } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    const updates: { name?: string; color?: string } = {}
    if (name) updates.name = name
    if (color) updates.color = color

    await bookla.updateResource(id, updates)

    return NextResponse.json({
      success: true,
      message: 'Employé mis à jour'
    })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
