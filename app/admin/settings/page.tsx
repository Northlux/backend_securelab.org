import { Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">System configuration and preferences</p>
      </div>

      <Card className="bg-slate-800/40 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Settings size={28} className="text-slate-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-md text-center">
            Email configuration, billing settings, security options,
            and system preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
