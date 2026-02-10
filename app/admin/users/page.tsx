'use client'

import { useState } from 'react'
import { Shield, Eye, UserX, Edit2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'suspended'
  created_at: string
  last_login_at: string | null
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@securelab.org',
    full_name: 'Admin User',
    role: 'admin',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    last_login_at: '2026-02-10T10:30:00Z',
  },
  {
    id: '2',
    email: 'analyst@securelab.org',
    full_name: 'Threat Analyst',
    role: 'user',
    status: 'active',
    created_at: '2026-01-15T00:00:00Z',
    last_login_at: '2026-02-09T15:45:00Z',
  },
  {
    id: '3',
    email: 'viewer@securelab.org',
    full_name: 'Report Viewer',
    role: 'viewer',
    status: 'active',
    created_at: '2026-02-01T00:00:00Z',
    last_login_at: '2026-02-08T09:20:00Z',
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<'admin' | 'user' | 'viewer'>('user')

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEditRole = (user: User) => {
    setEditingId(user.id)
    setEditRole(user.role)
  }

  const handleSaveRole = async (userId: string) => {
    setLoading(true)
    try {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: editRole } : u
        )
      )
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user? They will not be able to access the system.')) return

    setLoading(true)
    try {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, status: 'suspended' as const } : u
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user')
    } finally {
      setLoading(false)
    }
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-red-400" />
      case 'user':
        return <Edit2 size={16} className="text-blue-400" />
      case 'viewer':
        return <Eye size={16} className="text-slate-400" />
      default:
        return null
    }
  }

  const statusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-500/20 text-green-300'
      : 'bg-red-500/20 text-red-300'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Users</h1>
        <p className="text-sm text-slate-400 mt-1">Manage user accounts and permissions</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Last Login</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-100">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.full_name || '-'}</td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="flex gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            disabled={loading}
                            className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100"
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(user.id)}
                            disabled={loading}
                            className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={loading}
                            className="px-2 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          {roleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {editingId !== user.id && (
                          <>
                            <button
                              onClick={() => handleEditRole(user)}
                              disabled={loading}
                              className="p-1 text-slate-400 hover:text-brand-400 disabled:opacity-50 transition-colors"
                              title="Edit role"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleSuspend(user.id)}
                              disabled={loading || user.status === 'suspended'}
                              className="p-1 text-slate-400 hover:text-yellow-400 disabled:opacity-50 transition-colors"
                              title="Suspend user"
                            >
                              <UserX size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
