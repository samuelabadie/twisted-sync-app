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

export default function Dashboard() {
  const router = useRouter()
  const [services, setServices] = useState<GroupedService[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: 100, duration: 120, bufferBefore: 15, bufferAfter: 15, serviceType: '', serviceTypeId: '', resources: [] as string[] })
  const [addingService, setAddingService] = useState(false)
  const [deletingService, setDeletingService] = useState<string | null>(null)
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [editingType, setEditingType] = useState<{ serviceName: string; webflowId: string; currentTypeId: string } | null>(null)
  const [updatingType, setUpdatingType] = useState(false)
  const [resources, setResources] = useState<any[]>([])

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

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data)
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
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
      setNewService({ name: '', price: 100, duration: 120, bufferBefore: 15, bufferAfter: 15, serviceType: '', serviceTypeId: '', resources: [] })
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

  const totalServices = services.length
  const totalWithOptions = services.reduce((acc, s) => acc + 1 + s.options.length, 0)
  const syncedCount = services.filter(s => s.isFullySynced).length

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
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2"
              >
                <span className={syncing ? 'animate-spin' : ''}>🔄</span>
                {syncing ? 'Sync...' : 'Sync'}
              </button>
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
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-100">{syncedCount}/{totalServices}</p>
                <p className="text-sm text-stone-400">Synchronisés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{syncResult.error ? '❌' : '✅'}</span>
              <div>
                <p className="font-medium">{syncResult.message || syncResult.error}</p>
                {syncResult.summary && (
                  <p className="text-sm text-stone-400">
                    Vérifié: {syncResult.summary.checked} | 
                    Créé Bookla: {syncResult.summary.bookla_created} | 
                    Créé Webflow: {syncResult.summary.webflow_created}
                  </p>
                )}
              </div>
              <button onClick={() => setSyncResult(null)} className="ml-auto text-stone-500 hover:text-stone-300">✕</button>
            </div>
          </div>
        )}

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-amber-100 mb-6">Nouveau service</h2>
            <form onSubmit={handleAddService} className="space-y-4">
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

              {/* Resources Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Employés / Ressources</label>
                <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {resources.length === 0 ? (
                    <p className="text-sm text-stone-500 italic">Chargement des ressources...</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.map(resource => (
                        <label key={resource.id} className="flex items-center gap-3 cursor-pointer hover:bg-stone-700/50 p-1 rounded transition-colors">
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
                            className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500/50"
                          />
                          <span className="text-stone-300 text-sm">{resource.name}</span>
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

              <p className="text-sm text-stone-500">
                Les 3 options (Coupe des pointes, Shampoing démêlant, Shampoing et soin) seront ajoutées automatiquement.
              </p>
              <div className="flex gap-3 pt-4">
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
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex-1"
                >
                  {addingService ? 'Création...' : 'Créer le service'}
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
    </div>
  )
}

