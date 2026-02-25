'use client'

import { useEffect, useState } from 'react'
import {
  Shield,
  User,
  Crown,
  AlertTriangle,
  Eye,
  Wrench,
  BookOpen,
  Heart,
  Users as UsersIcon,
  Plus,
  X,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Group {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  userCount?: number
  permissionCount?: number
}

interface GroupManagementProps {
  userId: string
  userEmail: string
  currentGroups: string[]
  open: boolean
  onClose: () => void
  onUpdate: () => void
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
  Users: UsersIcon,
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

export function GroupManagement({
  userId,
  userEmail,
  currentGroups,
  open,
  onClose,
  onUpdate,
}: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [userGroups, setUserGroups] = useState<string[]>(currentGroups)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    setUserGroups(currentGroups)
  }, [currentGroups])

  useEffect(() => {
    if (open) {
      fetchGroups()
    }
  }, [open])

  const fetchGroups = async () => {
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
  }

  const handleToggleGroup = async (groupName: string) => {
    setUpdating(groupName)
    const action = userGroups.includes(groupName) ? 'remove' : 'add'

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/groups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, group: groupName }),
      })

      const json = await res.json()

      if (res.ok) {
        toast.success(json.message)
        setUserGroups(json.groups)
        onUpdate()
      } else {
        toast.error(json.error || 'Failed to update group')
      }
    } catch {
      toast.error('Network error')
    }

    setUpdating(null)
  }

  const isGroupActive = (groupName: string) => userGroups.includes(groupName)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Manage Groups</DialogTitle>
          <DialogDescription className="text-slate-400">
            Assign or remove groups for <span className="font-medium text-slate-300">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Current groups summary */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
              <div className="text-sm font-medium text-slate-400 mb-2">Current Groups</div>
              {userGroups.length === 0 ? (
                <div className="text-sm text-slate-500">No groups assigned</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userGroups.map((groupName) => {
                    const group = groups.find((g) => g.name === groupName)
                    if (!group) return null

                    const Icon = ICON_MAP[group.icon] || User
                    const colorClass = COLOR_MAP[group.color] || COLOR_MAP.slate

                    return (
                      <div
                        key={groupName}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClass}`}
                      >
                        <Icon size={12} />
                        {group.display_name}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Available groups */}
            <div>
              <div className="text-sm font-medium text-slate-400 mb-3">Available Groups</div>
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {groups.map((group) => {
                  const Icon = ICON_MAP[group.icon] || User
                  const colorClass = COLOR_MAP[group.color] || COLOR_MAP.slate
                  const active = isGroupActive(group.name)
                  const isUpdating = updating === group.name

                  return (
                    <button
                      key={group.id}
                      onClick={() => handleToggleGroup(group.name)}
                      disabled={isUpdating}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        active
                          ? `${colorClass} ring-2 ring-offset-2 ring-offset-slate-900`
                          : 'bg-slate-800/20 border-slate-700 hover:bg-slate-800/40 hover:border-slate-600'
                      } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          active ? colorClass : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`font-medium text-sm ${active ? '' : 'text-slate-300'}`}
                          >
                            {group.display_name}
                          </div>
                          {active && (
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <Check size={12} />
                              Active
                            </div>
                          )}
                        </div>
                        {group.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {group.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{group.userCount || 0} users</span>
                          <span>{group.permissionCount || 0} permissions</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center w-8 h-8">
                        {isUpdating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500" />
                        ) : active ? (
                          <X size={16} className="text-slate-400" />
                        ) : (
                          <Plus size={16} className="text-slate-400" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
