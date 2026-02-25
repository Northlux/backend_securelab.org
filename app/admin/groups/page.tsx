'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Shield,
  Crown,
  AlertTriangle,
  Eye,
  Wrench,
  BookOpen,
  Heart,
  User,
  RefreshCw,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  userCount: number
  permissionCount: number
  created_at: string
  updated_at: string
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Shield,
  User,
  Crown,
  AlertTriangle,
  Eye,
  Wrench,
  BookOpen,
  Heart,
  Users,
}

const COLOR_MAP: Record<string, string> = {
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/groups')
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
        return
      }

      setGroups(json.data || [])
    } catch {
      toast.error('Failed to load groups')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUsers = groups.reduce((sum, g) => sum + g.userCount, 0)
  const totalPermissions = groups.reduce((sum, g) => sum + g.permissionCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Group Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage access control groups and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => toast.info('Create group feature coming soon')}
            className="px-4 py-2 bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 border border-brand-500/20 font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500">Total Groups</span>
          </div>
          <div className="text-2xl font-bold text-slate-200">{groups.length}</div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-blue-400" />
            <span className="text-xs text-slate-500">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{totalUsers}</div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-purple-400" />
            <span className="text-xs text-slate-500">Total Permissions</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{totalPermissions}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/40 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Groups grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={20} className="text-slate-600 animate-spin" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">No groups found.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const Icon = ICON_MAP[group.icon] || User
            const colorClass = COLOR_MAP[group.color] || COLOR_MAP.slate

            return (
              <div
                key={group.id}
                className="bg-slate-800/40 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-all"
              >
                {/* Group header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg border ${colorClass}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-200 truncate">
                      {group.display_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{group.name}</p>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{group.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500">Users</div>
                    <div className="text-lg font-semibold text-slate-200">{group.userCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Permissions</div>
                    <div className="text-lg font-semibold text-slate-200">
                      {group.permissionCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Created</div>
                    <div className="text-xs font-medium text-slate-400">
                      {formatDate(group.created_at)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() =>
                      toast.info('View users feature coming soon')
                    }
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors"
                  >
                    View Users
                  </button>
                  <button
                    onClick={() =>
                      toast.info('Edit group feature coming soon')
                    }
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/15 rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
