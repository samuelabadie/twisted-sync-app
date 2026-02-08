'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Service {
  rowIndex: number
  webflow_id: string
  webflow_slug: string
  service_name: string
  bookla_service_id: string
  duration_minutes: number
  price_eur: number
  visible: boolean
  option_extra_slug?: string
  option_extra_price?: number
  option_extra_duration?: number
  final_price?: number
  final_duration_min?: number
  service_type?: string
  service_type_id?: string
  description_short?: string
  description_long?: string
  image_url?: string
}

interface EditingService {
  slug: string
  name: string
  price: number
  duration: number
  imageUrl: string
  linkedResources: string[]
}

interface GroupedService {
  slug: string
  name: string
  price: number
  duration: number
  visible: boolean
  parent: Service
  options: Service[]
  isFullySynced: boolean
}

interface ServiceType {
  id: string
  name: string
  slug: string
  serviceIds: string[]
}

interface Resource {
  id: string
  name: string
  color?: string
}

// Options disponibles (doit correspondre aux slugs du backend)
const AVAILABLE_OPTIONS = [
  { slug: 'coupe-des-pointes', name: 'Coupe des pointes (+10€)' },
  { slug: 'shampoing-dmlant', name: 'Shampoing démêlant (+20€)' },
  { slug: 'shampoing-et-soin', name: 'Shampoing et soin (+35€)' },
]

export default function Dashboard() {
  const router = useRouter()
  const [services, setServices] = useState<GroupedService[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newService, setNewService] = useState({ 
    name: '', 
    price: 100, 
    duration: 120, 
    bufferBefore: 15, 
    bufferAfter: 15, 
    serviceType: '', 
    serviceTypeId: '', 
    resources: [] as string[],
    selectedOptions: ['coupe-des-pointes', 'shampoing-dmlant', 'shampoing-et-soin'] // Toutes cochées par défaut
  })
  const [addingService, setAddingService] = useState(false)
  const [deletingService, setDeletingService] = useState<string | null>(null)
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<{ serviceName: string; webflowId: string; currentTypeId: string } | null>(null)
  const [updatingType, setUpdatingType] = useState(false)
  const [resources, setResources] = useState<any[]>([])
  const [editingService, setEditingService] = useState<EditingService | null>(null)
  const [savingService, setSavingService] = useState(false)

  // Resource management modal state
  const [resourceModalSlug, setResourceModalSlug] = useState<string | null>(null)
  const [resourceModalName, setResourceModalName] = useState('')
  const [linkedResources, setLinkedResources] = useState<Resource[]>([])
  const [availableResources, setAvailableResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [togglingResource, setTogglingResource] = useState<string | null>(null)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    loadServices()
    loadServiceTypes()
    loadResources()
  }, [])

  async function loadResources() {
    try {
      const res = await fetch('/api/resources') // We need to create this endpoint
      const data = await res.json()
      if (data.resources) setResources(data.resources)
    } catch (err: any) {
      console.error('Error loading resources:', err.message)
    }
  }

  async function loadServiceTypes() {
    try {
      const res = await fetch('/api/service-types')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setServiceTypes(data.serviceTypes || [])
    } catch (err: any) {
      console.error('Error loading service types:', err.message)
    }
  }

  async function loadServices() {
    try {
      setLoading(true)
      const res = await fetch('/api/services')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setServices(data.services || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    setAddingService(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShowAddForm(false)
      setNewService({ 
        name: '', 
        price: 100, 
        duration: 120, 
        bufferBefore: 15, 
        bufferAfter: 15, 
        serviceType: '', 
        serviceTypeId: '', 
        resources: [],
        selectedOptions: ['coupe-des-pointes', 'shampoing-dmlant', 'shampoing-et-soin']
      })
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAddingService(false)
    }
  }

  async function handleDeleteService(serviceName: string) {
    if (!confirm(`Supprimer "${serviceName}" et toutes ses options ?`)) return
    setDeletingService(serviceName)
    try {
      const res = await fetch(`/api/services?name=${encodeURIComponent(serviceName)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingService(null)
    }
  }

  async function handleToggleVisibility(serviceName: string, currentVisible: boolean) {
    setTogglingVisibility(serviceName)
    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName, visible: !currentVisible }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Update local state immediately for better UX
      setServices(prev => prev.map(s => 
        s.name === serviceName ? { ...s, visible: !currentVisible } : s
      ))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingVisibility(null)
    }
  }

  async function handleUpdateServiceType(newTypeId: string) {
    if (!editingType) return

    setUpdatingType(true)
    try {
      const selectedType = serviceTypes.find(t => t.id === newTypeId)

      const res = await fetch('/api/services/type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: editingType.serviceName,
          webflowId: editingType.webflowId,
          oldTypeId: editingType.currentTypeId,
          newTypeId: newTypeId,
          newTypeName: selectedType?.name || '',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setEditingType(null)
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingType(false)
    }
  }

  async function handleEditService(service: GroupedService) {
    // Pre-fill with current values while loading resources
    setEditingService({
      slug: service.slug,
      name: service.name,
      price: service.price,
      duration: service.duration,
      imageUrl: service.parent.image_url || '',
      linkedResources: [],
    })

    // Fetch linked resources from API
    try {
      const res = await fetch(`/api/services/${encodeURIComponent(service.slug)}`)
      const data = await res.json()
      if (data.service?.linkedResourceIds) {
        setEditingService(prev => prev ? {
          ...prev,
          linkedResources: data.service.linkedResourceIds
        } : null)
      }
    } catch (err) {
      console.error('Error fetching linked resources:', err)
    }
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault()
    if (!editingService) return

    setSavingService(true)
    try {
      const res = await fetch(`/api/services/${encodeURIComponent(editingService.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingService.name,
          price: editingService.price,
          duration: editingService.duration,
          imageUrl: editingService.imageUrl,
          resources: editingService.linkedResources,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setEditingService(null)
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingService(false)
    }
  }

  async function openResourceModal(slug: string, name: string) {
    setResourceModalSlug(slug)
    setResourceModalName(name)
    setLoadingResources(true)
    try {
      const res = await fetch(`/api/services/${encodeURIComponent(slug)}/resources`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLinkedResources(data.linked || [])
      setAvailableResources(data.available || [])
    } catch (err: any) {
      setError(err.message)
      setResourceModalSlug(null)
    } finally {
      setLoadingResources(false)
    }
  }

  async function handleLinkResource(resourceId: string) {
    if (!resourceModalSlug) return
    setTogglingResource(resourceId)
    try {
      const res = await fetch(`/api/services/${encodeURIComponent(resourceModalSlug)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const resource = availableResources.find(r => r.id === resourceId)
      if (resource) {
        setLinkedResources(prev => [...prev, resource].sort((a, b) => a.name.localeCompare(b.name)))
        setAvailableResources(prev => prev.filter(r => r.id !== resourceId))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingResource(null)
    }
  }

  async function handleUnlinkResource(resourceId: string) {
    if (!resourceModalSlug) return
    setTogglingResource(resourceId)
    try {
      const res = await fetch(`/api/services/${encodeURIComponent(resourceModalSlug)}/resources?resourceId=${resourceId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const resource = linkedResources.find(r => r.id === resourceId)
      if (resource) {
        setAvailableResources(prev => [...prev, resource].sort((a, b) => a.name.localeCompare(b.name)))
        setLinkedResources(prev => prev.filter(r => r.id !== resourceId))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingResource(null)
    }
  }

  const totalServices = services.length
  const totalWithOptions = services.reduce((acc, s) => acc + 1 + s.options.length, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <span className="text-xl">✂️</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-amber-100">Twisted Admin</h1>
                <p className="text-sm text-stone-400">Gestion des services</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/service-types"
                className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2"
              >
                <span>📂</span>
                Types
              </Link>
              <Link
                href="/employees"
                className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2"
              >
                <span>👥</span>
                Employés
              </Link>
              <Link
                href="/bookings"
                className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2"
              >
                <span>📋</span>
                Réservations
              </Link>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>➕</span>
                Nouveau service
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-red-400 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-red-800"
                title="Déconnexion"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-900/30 flex items-center justify-center text-2xl">
                💇
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-100">{totalServices}</p>
                <p className="text-sm text-stone-400">Services parents</p>
              </div>
            </div>
          </div>
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center text-2xl">
                📦
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-100">{totalWithOptions}</p>
                <p className="text-sm text-stone-400">Total avec options</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-2xl shadow-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-200">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
            </div>
          </div>
        )}

        {/* Services List */}
        {loading ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-stone-400">Chargement des services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-stone-400">Aucun service trouvé</p>
            <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg mt-4">
              Ajouter un service
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div
                key={service.slug}
                className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6 animate-fade-in hover:border-stone-700 transition-colors"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-amber-100">{service.name}</h3>
                      {service.isFullySynced ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Synchronisé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-900/40 text-amber-400 text-xs font-medium rounded-full border border-amber-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          En attente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-stone-400 mb-4">
                      <span className="flex items-center gap-1.5">
                        <span>💰</span> {service.price}€
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span>⏱️</span> {service.duration} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span>🔗</span> {service.slug}
                      </span>
                      <button
                        onClick={() => setEditingType({
                          serviceName: service.name,
                          webflowId: service.parent.webflow_id,
                          currentTypeId: service.parent.service_type_id || ''
                        })}
                        className="flex items-center gap-1.5 px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                      >
                        <span>📂</span> 
                        <span className={service.parent.service_type ? 'text-purple-400' : 'text-stone-500'}>
                          {service.parent.service_type || 'Aucun type'}
                        </span>
                      </button>
                    </div>
                    
                    {/* Options */}
                    {service.options.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-stone-700 space-y-2">
                        {service.options.map(opt => (
                          <div key={opt.rowIndex} className="flex items-center gap-4 text-sm">
                            <span className="text-stone-500">↳</span>
                            <span className="text-stone-300">+ {opt.option_extra_slug?.replace(/-/g, ' ')}</span>
                            <span className="text-stone-500">+{opt.option_extra_price}€</span>
                            <span className="text-stone-500">+{opt.option_extra_duration}min</span>
                            {opt.bookla_service_id && opt.webflow_id ? (
                              <span className="text-emerald-500 text-xs">✓</span>
                            ) : (
                              <span className="text-amber-500 text-xs">○</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleToggleVisibility(service.name, service.visible)}
                      disabled={togglingVisibility === service.name}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        service.visible
                          ? 'bg-emerald-600'
                          : 'bg-stone-700'
                      } ${togglingVisibility === service.name ? 'opacity-50' : ''}`}
                      title={service.visible ? 'Visible sur le site' : 'Masqué du site'}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          service.visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${service.visible ? 'text-emerald-400' : 'text-stone-500'}`}>
                      {togglingVisibility === service.name ? '...' : (service.visible ? 'Visible' : 'Masqué')}
                    </span>

                    {/* Resources Button */}
                    <button
                      onClick={() => openResourceModal(service.slug, service.name)}
                      className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800/70 text-blue-200 font-medium rounded-lg transition-all duration-300 border border-blue-800/50 hover:border-blue-700 text-sm"
                    >
                      👥 Ressources
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditService(service)}
                      className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 font-medium rounded-lg transition-all duration-300 border border-amber-800/50 hover:border-amber-700 text-sm"
                    >
                      ✏️ Modifier
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteService(service.name)}
                      disabled={deletingService === service.name}
                      className="px-4 py-2 bg-red-900/50 hover:bg-red-800/70 text-red-200 font-medium rounded-lg transition-all duration-300 border border-red-800/50 hover:border-red-700 text-sm"
                    >
                      {deletingService === service.name ? '...' : '🗑️ Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-4xl mx-auto my-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-6">Nouveau service</h2>
            <form onSubmit={handleAddService} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne Gauche : Infos de base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-stone-200 border-b border-stone-800 pb-2 mb-4">Informations</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Nom du service</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={e => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Ex: Tresses africaines"
                      className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-2">Prix (€)</label>
                      <input
                        type="number"
                        value={newService.price}
                        onChange={e => setNewService({ ...newService, price: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-2">Durée (min)</label>
                      <input
                        type="number"
                        value={newService.duration}
                        onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                        min="15"
                        step="15"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-2">Buffer avant (min)</label>
                      <input
                        type="number"
                        value={newService.bufferBefore}
                        onChange={e => setNewService({ ...newService, bufferBefore: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                        min="0"
                        step="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-2">Buffer après (min)</label>
                      <input
                        type="number"
                        value={newService.bufferAfter}
                        onChange={e => setNewService({ ...newService, bufferAfter: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                        min="0"
                        step="5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Type de service</label>
                    <select
                      value={newService.serviceTypeId}
                      onChange={e => {
                        const selectedType = serviceTypes.find(t => t.id === e.target.value)
                        setNewService({ 
                          ...newService, 
                          serviceTypeId: e.target.value,
                          serviceType: selectedType?.name || ''
                        })
                      }}
                      className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                    >
                      <option value="">-- Sélectionner un type --</option>
                      {serviceTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">Le service sera ajouté à ce type sur Webflow</p>
                  </div>
                </div>

                {/* Colonne Droite : Paramètres avancés */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-stone-200 border-b border-stone-800 pb-2 mb-4">Paramètres</h3>

                  {/* Resources Selection */}
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Employés / Ressources</label>
                    <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
                      {resources.length === 0 ? (
                        <p className="text-sm text-stone-500 italic">Chargement des ressources...</p>
                      ) : (
                        <div className="space-y-2">
                          {resources.map(resource => (
                            <label key={resource.id} className="flex items-center gap-3 cursor-pointer hover:bg-stone-700/50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={newService.resources.includes(resource.id)}
                                onChange={e => {
                                  const checked = e.target.checked
                                  setNewService(prev => ({
                                    ...prev,
                                    resources: checked 
                                      ? [...prev.resources, resource.id]
                                      : prev.resources.filter(id => id !== resource.id)
                                  }))
                                }}
                                className="w-5 h-5 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500/50"
                              />
                              <span className="text-stone-300 text-sm font-medium">{resource.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {newService.resources.length === 0 
                        ? "⚠️ Aucune ressource sélectionnée (le service ne sera pas réservable)" 
                        : `${newService.resources.length} ressource(s) sélectionnée(s)`}
                    </p>
                  </div>

                  {/* Options Selection */}
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Options incluses</label>
                    <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-3">
                      <div className="space-y-2">
                        {AVAILABLE_OPTIONS.map(opt => (
                          <label key={opt.slug} className="flex items-center gap-3 cursor-pointer hover:bg-stone-700/50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={newService.selectedOptions.includes(opt.slug)}
                              onChange={e => {
                                const checked = e.target.checked
                                setNewService(prev => ({
                                  ...prev,
                                  selectedOptions: checked 
                                    ? [...prev.selectedOptions, opt.slug]
                                    : prev.selectedOptions.filter(slug => slug !== opt.slug)
                                }))
                              }}
                              className="w-5 h-5 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500/50"
                            />
                            <span className="text-stone-300 text-sm font-medium">{opt.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Décochez les options que vous ne voulez pas créer pour ce service.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-stone-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addingService}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingService ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔄</span> Création en cours...
                    </span>
                  ) : 'Créer le service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Type Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-amber-100 mb-2">Modifier le type</h2>
            <p className="text-stone-400 mb-6">Service : {editingType.serviceName}</p>

            <div className="space-y-3">
              {/* Option to remove type */}
              <button
                onClick={() => handleUpdateServiceType('')}
                disabled={updatingType}
                className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                  !editingType.currentTypeId
                    ? 'bg-amber-600/20 border-amber-500 text-amber-100'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'
                }`}
              >
                <span className="text-stone-500">Aucun type</span>
              </button>

              {/* Service types */}
              {serviceTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleUpdateServiceType(type.id)}
                  disabled={updatingType}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                    editingType.currentTypeId === type.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-100'
                      : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'
                  }`}
                >
                  <span>{type.name}</span>
                  {editingType.currentTypeId === type.id && (
                    <span className="text-purple-400">✓ Actuel</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setEditingType(null)}
                disabled={updatingType}
                className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex-1"
              >
                {updatingType ? 'Mise à jour...' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Management Modal */}
      {resourceModalSlug && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setResourceModalSlug(null)}
        >
          <div
            className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-100">{resourceModalName}</h2>
                <p className="text-sm text-stone-400">Gestion des ressources (parent + options)</p>
              </div>
              <button
                onClick={() => setResourceModalSlug(null)}
                className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {loadingResources ? (
              <div className="text-center py-8">
                <div className="animate-spin text-3xl mb-3">🔄</div>
                <p className="text-stone-400">Chargement des ressources...</p>
              </div>
            ) : (
              <>
                {/* Linked Resources */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3">
                    Ressources assignées ({linkedResources.length})
                  </h3>
                  {linkedResources.length === 0 ? (
                    <p className="text-stone-500 text-sm py-2">Aucune ressource assignée</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {linkedResources.map(res => (
                        <span
                          key={res.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-stone-900"
                          style={{ backgroundColor: res.color || '#CFC4E8' }}
                        >
                          {res.name}
                          <button
                            onClick={() => handleUnlinkResource(res.id)}
                            disabled={togglingResource === res.id}
                            className="w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-colors"
                          >
                            {togglingResource === res.id ? '·' : '✕'}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Resources */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3">
                    Ressources disponibles ({availableResources.length})
                  </h3>
                  {availableResources.length === 0 ? (
                    <p className="text-stone-500 text-sm py-2">Toutes les ressources sont assignées</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableResources.map(res => (
                        <span
                          key={res.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-stone-700 text-stone-300 bg-stone-800/50"
                        >
                          {res.name}
                          <button
                            onClick={() => handleLinkResource(res.id)}
                            disabled={togglingResource === res.id}
                            className="w-5 h-5 rounded-full bg-green-600/80 hover:bg-green-500 text-white flex items-center justify-center text-xs transition-colors"
                          >
                            {togglingResource === res.id ? '·' : '+'}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-auto my-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-2">Modifier le service</h2>
            <p className="text-stone-400 mb-6">Les modifications seront appliquées sur la base de données, Bookla et Webflow</p>

            <form onSubmit={handleSaveService} className="space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Nom du service</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                  required
                />
              </div>

              {/* Prix et Durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Prix (€)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={e => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                    min="0"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">Les options seront recalculées automatiquement</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Durée (min)</label>
                  <input
                    type="number"
                    value={editingService.duration}
                    onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                    min="15"
                    step="15"
                    required
                  />
                </div>
              </div>

              {/* Employés / Ressources */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Employés / Ressources</label>
                <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {resources.length === 0 ? (
                    <p className="text-sm text-stone-500 italic">Chargement des ressources...</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.map(resource => (
                        <label key={resource.id} className="flex items-center gap-3 cursor-pointer hover:bg-stone-700/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={editingService.linkedResources.includes(resource.id)}
                            onChange={e => {
                              const checked = e.target.checked
                              setEditingService(prev => prev ? {
                                ...prev,
                                linkedResources: checked
                                  ? [...prev.linkedResources, resource.id]
                                  : prev.linkedResources.filter(id => id !== resource.id)
                              } : null)
                            }}
                            className="w-5 h-5 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500/50"
                          />
                          <span className="text-stone-300 text-sm font-medium">{resource.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {editingService.linkedResources.length === 0
                    ? "⚠️ Aucune ressource sélectionnée (le service ne sera pas réservable)"
                    : `${editingService.linkedResources.length} ressource(s) sélectionnée(s)`}
                </p>
              </div>

              {/* URL Image */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">URL de l'image</label>
                <input
                  type="url"
                  value={editingService.imageUrl}
                  onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })}
                  placeholder="https://drive.google.com/... ou autre URL"
                  className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                />
                <p className="text-xs text-stone-500 mt-1">Collez l'URL d'une image (Google Drive, Dropbox, etc.)</p>
                {editingService.imageUrl && (
                  <div className="mt-3 p-2 bg-stone-800 rounded-lg">
                    <img
                      src={editingService.imageUrl}
                      alt="Aperçu"
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-6 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  disabled={savingService}
                  className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingService ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔄</span> Enregistrement...
                    </span>
                  ) : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

