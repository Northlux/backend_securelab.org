'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, Search, Edit, Eye, Trash2, AlertCircle, Loader } from 'lucide-react'
import { getUsers, type UserListResponse } from '@/app/actions/users'

interface FilterState {
  search: string
  role: string
  status: string
}

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'user', label: 'User' },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
]

const roleBadgeColor = {
  admin: 'bg-red-500/20 text-red-300 border border-red-500/30',
  analyst: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  user: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
} as const

const statusBadgeColor = {
  active: 'bg-green-500/20 text-green-300 border border-green-500/30',
  suspended: 'bg-red-500/20 text-red-300 border border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
} as const

export default function UserPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserListResponse | null>(null)
  const [filters, setFilters] = useState<FilterState>({ search: '', role: '', status: '' })
  const [page, setPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Load users on mount
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getUsers(page, 20, {
        role: filters.role || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      })
      setUsers(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [page, filters])

  // Filter updates
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      setSelectedUsers(new Set(users.users.map(u => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUsers)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedUsers(newSet)
  }

  const allSelected = users && users.users.length > 0 && selectedUsers.size === users.users.length

  // Pagination
  const totalPages = users ? Math.ceil(users.total / users.pageSize) : 0
  const canPrevPage = page > 1
  const canNextPage = page < totalPages

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">Search by email</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 pl-9 text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
          <div className="relative">
            <select
              value={filters.role}
              onChange={e => handleFilterChange('role', e.target.value)}
              className="appearance-none bg-slate-700 border border-slate-600 rounded-md px-3 py-2 pr-8 text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="appearance-none bg-slate-700 border border-slate-600 rounded-md px-3 py-2 pr-8 text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : 'Load Users'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-200">Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-700/50 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader size={24} className="text-brand-600 animate-spin" />
          </div>
        ) : !users || users.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <AlertCircle size={32} className="mb-2 opacity-50" />
            <p>No users found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_140px_120px] gap-4 p-4 bg-slate-900/50 border-b border-slate-700/50">
              <input
                type="checkbox"
                checked={allSelected ?? false}
                onChange={e => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 accent-brand-600"
              />
              <div className="font-medium text-slate-300 text-sm">Email</div>
              <div className="font-medium text-slate-300 text-sm">Role</div>
              <div className="font-medium text-slate-300 text-sm">Status</div>
              <div className="font-medium text-slate-300 text-sm">Created</div>
              <div className="font-medium text-slate-300 text-sm">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-700/50">
              {users.users.map(user => (
                <div key={user.id} className="grid grid-cols-[40px_1fr_120px_120px_140px_120px] gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 rounded border-slate-600 accent-brand-600"
                  />

                  <div className="truncate">
                    <p className="text-sm text-slate-100 font-medium">{user.email}</p>
                    <p className="text-xs text-slate-400">{user.user_metadata?.full_name || 'No name'}</p>
                  </div>

                  <span className={`px-2 py-1 rounded text-xs font-medium text-center ${roleBadgeColor[user.user_metadata?.role as keyof typeof roleBadgeColor] || 'bg-slate-700 text-slate-300'}`}>
                    {user.user_metadata?.role || 'user'}
                  </span>

                  <span className={`px-2 py-1 rounded text-xs font-medium text-center ${statusBadgeColor[user.status as keyof typeof statusBadgeColor] || 'bg-slate-700 text-slate-300'}`}>
                    {user.status || 'active'}
                  </span>

                  <span className="text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors" title="View details">
                      <Eye size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors" title="Edit user">
                      <Edit size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors" title="Delete user">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-900/25">
              <div className="text-xs text-slate-400">
                Showing {users.users.length} of {users.total} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!canPrevPage}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!canNextPage}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
