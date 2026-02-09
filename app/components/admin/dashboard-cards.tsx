import { Shield, Database, AlertCircle, TrendingUp } from 'lucide-react'

interface SignalStats {
  totalSignals: number
  thisWeek: number
  critical: number
}

interface SourceStats {
  totalSources: number
  activeSources: number
}

interface DashboardCardsProps {
  stats: SignalStats
  sources: SourceStats
}

export default function DashboardCards({ stats, sources }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Total Signals',
      value: stats.totalSignals.toLocaleString(),
      trend: `↑ ${stats.thisWeek} this week`,
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Critical Alerts',
      value: stats.critical.toString(),
      trend: 'Require immediate attention',
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      title: 'Active Sources',
      value: `${sources.activeSources}/${sources.totalSources}`,
      trend: 'Connected and ingesting',
      icon: Database,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Ingestion Rate',
      value: 'Active',
      trend: 'Hourly scheduled jobs',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <div
            key={card.title}
            className={`border rounded-lg p-6 ${card.bgColor} ${card.borderColor} transition hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                <p className="text-slate-500 text-xs mt-3">{card.trend}</p>
              </div>
              <IconComponent className={`${card.color} opacity-50`} size={28} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
