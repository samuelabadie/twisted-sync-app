import { NextResponse } from 'next/server'
import { DatabaseService } from '../../../src/lib/database'

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {}

  // Check DB connectivity
  const dbStart = Date.now()
  try {
    const db = new DatabaseService()
    await db.countServices()
    checks.database = {
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    }
  } catch (error: any) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: error.message,
    }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
