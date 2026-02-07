'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Booking {
  id: number
  booking_id: string
  client_email: string
  client_name: string | null
  client_phone: string | null
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  checkout_url: string
  created_at: string
  updated_at: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Payé
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-900/50 text-red-300 border border-red-700">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          Annulé
        </span>
      )
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-900/50 text-amber-300 border border-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          En attente
        </span>
      )
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays} jours`
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) {
      console.error('Error loading bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    paid: bookings.filter(b => b.status === 'paid').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const conversionRate = stats.total > 0
    ? Math.round((stats.paid / stats.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-stone-400 hover:text-stone-200 transition-colors"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                📋 Réservations
              </h1>
            </div>
            <button
              onClick={loadBookings}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-4">
            <p className="text-2xl font-bold text-stone-100">{stats.total}</p>
            <p className="text-sm text-stone-400">Total</p>
          </div>
          <div
            className={`bg-stone-900/80 backdrop-blur-sm border rounded-2xl shadow-xl p-4 cursor-pointer transition-all ${filter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-800 hover:border-amber-700'}`}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          >
            <p className="text-2xl font-bold text-amber-300">{stats.pending}</p>
            <p className="text-sm text-stone-400">En attente</p>
          </div>
          <div
            className={`bg-stone-900/80 backdrop-blur-sm border rounded-2xl shadow-xl p-4 cursor-pointer transition-all ${filter === 'paid' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-800 hover:border-emerald-700'}`}
            onClick={() => setFilter(filter === 'paid' ? 'all' : 'paid')}
          >
            <p className="text-2xl font-bold text-emerald-300">{stats.paid}</p>
            <p className="text-sm text-stone-400">Payés</p>
          </div>
          <div
            className={`bg-stone-900/80 backdrop-blur-sm border rounded-2xl shadow-xl p-4 cursor-pointer transition-all ${filter === 'cancelled' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-stone-800 hover:border-red-700'}`}
            onClick={() => setFilter(filter === 'cancelled' ? 'all' : 'cancelled')}
          >
            <p className="text-2xl font-bold text-red-300">{stats.cancelled}</p>
            <p className="text-sm text-stone-400">Annulés</p>
          </div>
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-4">
            <p className="text-2xl font-bold text-blue-300">{conversionRate}%</p>
            <p className="text-sm text-stone-400">Conversion</p>
          </div>
        </div>

        {/* Filter info */}
        {filter !== 'all' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-stone-400">Filtre actif :</span>
            {getStatusBadge(filter)}
            <button
              onClick={() => setFilter('all')}
              className="ml-2 text-stone-500 hover:text-stone-300"
            >
              ✕ Effacer
            </button>
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-stone-400">
              {filter !== 'all' ? 'Aucune réservation avec ce statut' : 'Aucune réservation pour le moment'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-stone-900/80 backdrop-blur-sm border rounded-xl shadow-lg p-4 transition-all hover:shadow-xl ${
                  booking.status === 'pending'
                    ? 'border-amber-800/50 bg-amber-950/20'
                    : booking.status === 'cancelled'
                    ? 'border-red-800/30 opacity-60'
                    : 'border-stone-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-stone-500 text-sm">
                        {getTimeAgo(booking.created_at)}
                      </span>
                    </div>
                    {booking.client_name && (
                      <p className="text-lg font-medium text-stone-100">
                        {booking.client_name}
                      </p>
                    )}
                    <p className={`text-stone-400 ${booking.client_name ? 'text-sm' : 'text-lg font-medium text-stone-100'}`}>
                      {booking.client_email}
                    </p>
                    {booking.client_phone && (
                      <p className="text-sm text-stone-400">
                        {booking.client_phone}
                      </p>
                    )}
                    <p className="text-sm text-stone-500">
                      {formatDate(booking.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-300">
                      {booking.amount.toFixed(2)}€
                    </p>
                    <p className="text-xs text-stone-500 font-mono">
                      {booking.booking_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
