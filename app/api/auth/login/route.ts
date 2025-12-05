import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    const correctPassword = process.env.APP_PASSWORD
    
    if (!correctPassword) {
      console.error('APP_PASSWORD not configured')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }
    
    if (password === correctPassword) {
      // Create a simple auth token (in production, use a proper JWT)
      const token = Buffer.from(`twisted-auth-${Date.now()}`).toString('base64')
      
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
