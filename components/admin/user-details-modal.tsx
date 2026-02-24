'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Shield,
  Clock,
  Monitor,
  Activity,
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user' | 'guest'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  created_at: string
  last_login_at: string | null
}

interface Session {
  id: string
  user_agent: string | null
  ip_address: string | null
  last_activity_at: string
  expires_at: string
}

interface AuditLog {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  created_at: string
  metadata: Record<string, unknown>
}

interface Props {
  userId: string
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function UserDetailsModal({ userId, open, onClose, onUpdate }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!open || !userId) return

    const fetchUser = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/admin/users/${userId}`)
        const json = await res.json()

        if (json.error) {
          toast.error(json.error)
          onClose()
          return
        }

        setUser(json.user)
        setSessions(json.sessions || [])
        setAuditLogs(json.auditLogs || [])
      } catch {
        toast.error('Failed to load user details')
        onClose()
      }
      setLoading(false)
    }

    fetchUser()
  }, [userId, open, onClose])

  const handleUpdateRole = async (role: string) => {
    if (!user) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (res.ok) {
        const json = await res.json()
        setUser(json.user)
        toast.success('Role updated')
        onUpdate()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to update role')
      }
    } catch {
      toast.error('Network error')
    }
    setUpdating(false)
  }

  const handleUpdateStatus = async (status: string) => {
    if (!user) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const json = await res.json()
        setUser(json.user)
        toast.success('Status updated')
        onUpdate()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to update status')
      }
    } catch {
      toast.error('Network error')
    }
    setUpdating(false)
  }

  const handleRevokeSessions = async () => {
    if (!confirm('Revoke all sessions? This will log the user out immediately.')) {
      return
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/sessions`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSessions([])
        toast.success('All sessions revoked')
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to revoke sessions')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user && !loading) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile section */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Email</span>
                  <span className="text-sm text-slate-200">{user.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Full Name</span>
                  <span className="text-sm text-slate-200">{user.full_name || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Created</span>
                  <span className="text-sm text-slate-200">{formatDate(user.created_at)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Last Login</span>
                  <span className="text-sm text-slate-200">
                    {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Shield size={14} />
                  Role
                </h3>
                <Select
                  value={user.role}
                  onValueChange={handleUpdateRole}
                  disabled={updating}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Activity size={14} />
                  Status
                </h3>
                <Select
                  value={user.status}
                  onValueChange={handleUpdateStatus}
                  disabled={updating}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Monitor size={14} />
                  Active Sessions ({sessions.length})
                </h3>
                {sessions.length > 0 && (
                  <button
                    onClick={handleRevokeSessions}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Revoke All
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500">No active sessions</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start justify-between p-2 bg-slate-900/40 rounded border border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 truncate">
                          {session.user_agent || 'Unknown device'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {session.ip_address || 'Unknown IP'} • Last active{' '}
                          {formatDate(session.last_activity_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Recent Activity ({auditLogs.length})
              </h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No activity recorded</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 p-2 bg-slate-900/40 rounded border border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300">
                          {log.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(log.created_at)}
                          {log.resource_type && ` • ${log.resource_type}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
