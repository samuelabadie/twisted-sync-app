'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  name: string
  color?: string
  type?: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', color: '#CFC4E8' })
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    try {
      setLoading(true)
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEmployees(data.employees || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmployee.name.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setShowAddForm(false)
      setNewEmployee({ name: '', color: '#CFC4E8' })
      await loadEmployees()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteEmployee(employeeId: string, employeeName: string) {
    if (!confirm(`Supprimer l'employé "${employeeName}" ?\n\nAttention : cela peut affecter les services auxquels il est assigné.`)) return

    setDeleting(employeeId)
    try {
      const res = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadEmployees()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  // Predefined colors for employees
  const COLORS = [
    { name: 'Violet', value: '#CFC4E8' },
    { name: 'Bleu', value: '#A8D8EA' },
    { name: 'Vert', value: '#A8E6CF' },
    { name: 'Rose', value: '#FFB6C1' },
    { name: 'Orange', value: '#FFDAB9' },
    { name: 'Jaune', value: '#FFFACD' },
  ]

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
                <h1 className="font-display text-2xl font-bold text-amber-100">Employés</h1>
                <p className="text-sm text-stone-400">Gérer les coiffeurs / ressources Bookla</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>➕</span>
                Nouvel employé
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
            <div className="w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-100">{employees.length}</p>
              <p className="text-sm text-stone-400">Employés / Ressources</p>
            </div>
          </div>
        </div>

        {/* Employees List */}
        {loading ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-stone-400">Chargement...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-4xl mb-4">👤</div>
            <p className="text-stone-400">Aucun employé</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg mt-4"
            >
              Ajouter un employé
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee, idx) => (
              <div
                key={employee.id}
                className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6 animate-fade-in hover:border-stone-700 transition-colors"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-stone-900"
                      style={{ backgroundColor: employee.color || '#CFC4E8' }}
                    >
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100">{employee.name}</h3>
                      <p className="text-sm text-stone-500">ID: {employee.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                    disabled={deleting === employee.id}
                    className="p-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors"
                  >
                    {deleting === employee.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-amber-100 mb-6">Nouvel employé</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Nom de l'employé</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Ex: Marie, Jean..."
                  className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Couleur (calendrier)</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEmployee({ ...newEmployee, color: color.value })}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        newEmployee.color === color.value
                          ? 'border-amber-500 scale-110'
                          : 'border-transparent hover:border-stone-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewEmployee({ name: '', color: '#CFC4E8' })
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
