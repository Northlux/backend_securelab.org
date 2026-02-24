'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  Shield,
  UserX,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserDetailsModal } from '@/components/admin/user-details-modal'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'user' | 'guest'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  created_at: string
  last_login_at: string | null
}

interface StatsData {
  byRole: Record<string, number>
  byStatus: Record<string, number>
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  user: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  guest: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400',
  inactive: 'bg-slate-500/15 text-slate-400',
  suspended: 'bg-red-500/15 text-red-400',
  pending_verification: 'bg-yellow-500/15 text-yellow-400',
}

const STATUS_ICONS: Record<string, React.ComponentType<{ size: number }>> = {
  active: CheckCircle,
  inactive: Clock,
  suspended: Ban,
  pending_verification: AlertTriangle,
}

function formatDate(date: string | null): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      const res = await fetch(`/api/v1/admin/users?${params.toString()}`)
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
        return
      }

      setUsers(json.data || [])
      setPagination(json.pagination || null)
      setStats(json.stats || null)
    } catch {
      toast.error('Failed to load users')
    }
    setLoading(false)
  }, [searchParams])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('search', query)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleFilterRole = (role: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('role')
    if (current === role) {
      params.delete('role')
    } else {
      params.set('role', role)
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleFilterStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('status')
    if (current === status) {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user? They will be logged out immediately.')) {
      return
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('User suspended')
        fetchUsers()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to suspend user')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to make this user an admin?')) {
      return
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })

      if (res.ok) {
        toast.success('User promoted to admin')
        fetchUsers()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to update role')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const currentRole = searchParams.get('role')
  const currentStatus = searchParams.get('status')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-slate-500" />
              <span className="text-xs text-slate-500">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-slate-200">
              {Object.values(stats.byRole).reduce((a, b) => a + b, 0)}
            </div>
          </div>

          <button
            onClick={() => handleFilterRole('admin')}
            className={`bg-slate-800/40 border rounded-lg p-4 text-left transition-all ${
              currentRole === 'admin'
                ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-purple-400" />
              <span className="text-xs text-slate-500">Admins</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.byRole.admin || 0}</div>
          </button>

          <button
            onClick={() => handleFilterRole('user')}
            className={`bg-slate-800/40 border rounded-lg p-4 text-left transition-all ${
              currentRole === 'user'
                ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs text-slate-500">Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.byRole.user || 0}</div>
          </button>

          <button
            onClick={() => handleFilterStatus('active')}
            className={`bg-slate-800/40 border rounded-lg p-4 text-left transition-all ${
              currentStatus === 'active'
                ? 'border-green-500/50 ring-2 ring-green-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.byStatus.active || 0}</div>
          </button>

          <button
            onClick={() => handleFilterStatus('suspended')}
            className={`bg-slate-800/40 border rounded-lg p-4 text-left transition-all ${
              currentStatus === 'suspended'
                ? 'border-red-500/50 ring-2 ring-red-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Ban size={16} className="text-red-400" />
              <span className="text-xs text-slate-500">Suspended</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.byStatus.suspended || 0}</div>
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/40 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>
        <button
          onClick={() => handleSearch(searchQuery)}
          className="px-4 py-2 bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 border border-brand-500/20 font-medium rounded-lg transition-all"
        >
          Search
        </button>
      </div>

      {/* Users table */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UserX size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-3">No users found.</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/40 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((user) => {
                  const StatusIcon = STATUS_ICONS[user.status]
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{user.email}</div>
                          {user.full_name && (
                            <div className="text-xs text-slate-500">{user.full_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            ROLE_COLORS[user.role] || 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[user.status] || 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {StatusIcon && <StatusIcon size={12} />}
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser(user.id)
                              }}
                              className="text-slate-300 hover:text-slate-100 cursor-pointer"
                            >
                              View Details
                            </DropdownMenuItem>
                            {user.role !== 'admin' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMakeAdmin(user.id)
                                }}
                                className="text-purple-400 hover:text-purple-300 cursor-pointer"
                              >
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'suspended' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSuspendUser(user.id)
                                }}
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Suspend User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages} - {pagination.total} users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* User details modal */}
      {selectedUser && (
        <UserDetailsModal
          userId={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  )
}
