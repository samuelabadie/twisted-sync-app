'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ServiceType {
  id: string
  name: string
  slug: string
  serviceIds: string[]
  categoryIds: string[]
}

interface Category {
  id: string
  name: string
}

export default function ServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newType, setNewType] = useState({ name: '', categoryIds: [] as string[] })
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [typesRes, categoriesRes] = await Promise.all([
        fetch('/api/service-types'),
        fetch('/api/service-types/categories')
      ])
      
      const typesData = await typesRes.json()
      const categoriesData = await categoriesRes.json()
      
      if (typesData.error) throw new Error(typesData.error)
      
      setServiceTypes(typesData.serviceTypes || [])
      setCategories(categoriesData.categories || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!newType.name.trim()) return
    
    setAdding(true)
    try {
      const res = await fetch('/api/service-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setShowAddForm(false)
      setNewType({ name: '', categoryIds: [] })
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteType(typeId: string, typeName: string) {
    if (!confirm(`Supprimer le type "${typeName}" ?`)) return
    
    setDeleting(typeId)
    try {
      const res = await fetch(`/api/service-types?id=${typeId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function toggleCategory(categoryId: string) {
    setNewType(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }))
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
                <span className="text-xl">←</span>
              </Link>
              <div>
                <h1 className="font-display text-2xl font-bold text-amber-100">Types de service</h1>
                <p className="text-sm text-stone-400">Gérer les catégories de coiffures</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>➕</span>
              Nouveau type
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Stats */}
        <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center text-2xl">
              📂
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-100">{serviceTypes.length}</p>
              <p className="text-sm text-stone-400">Types de service</p>
            </div>
          </div>
        </div>

        {/* Types List */}
        {loading ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-stone-400">Chargement...</p>
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-stone-400">Aucun type de service</p>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg mt-4"
            >
              Créer un type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceTypes.map((type, idx) => (
              <div
                key={type.id}
                className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6 animate-fade-in hover:border-stone-700 transition-colors"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-amber-100">{type.name}</h3>
                    <p className="text-sm text-stone-500">{type.slug}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteType(type.id, type.name)}
                    disabled={deleting === type.id}
                    className="p-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors"
                  >
                    {deleting === type.id ? '...' : '🗑️'}
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <span>💇</span> {type.serviceIds.length} services
                  </span>
                </div>

                {type.categoryIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {type.categoryIds.map(catId => {
                      const cat = categories.find(c => c.id === catId)
                      return cat ? (
                        <span key={catId} className="px-2 py-1 bg-stone-800 text-stone-300 text-xs rounded-full">
                          {cat.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Type Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-amber-100 mb-6">Nouveau type de service</h2>
            <form onSubmit={handleAddType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Nom du type</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={e => setNewType({ ...newType, name: e.target.value })}
                  placeholder="Ex: Cornrows, Fulani, Twists..."
                  className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                  required
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Catégories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                          newType.categoryIds.includes(cat.id)
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Sélectionne homme, femme ou les deux</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewType({ name: '', categoryIds: [] })
                  }}
                  className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex-1"
                >
                  {adding ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
