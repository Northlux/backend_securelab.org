import { getGitHubSources } from '@/app/actions/github/github-sources'
import { GitHubRepoCard } from '@/app/components/github/github-repo-card'

export const metadata = {
  title: 'GitHub Sources - Securelab Admin',
  description: 'Manage and view security-related GitHub repositories',
}

export default async function GitHubSourcesPage() {
  const repos = await getGitHubSources()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">GitHub Sources</h1>
        <p className="text-sm text-slate-400 mt-1">Security-related repositories and projects from GitHub</p>
      </div>

      {/* Grid */}
      {repos.length === 0 ? (
        <div className="flex items-center justify-center min-h-96 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="text-center">
            <p className="text-slate-400">No GitHub sources configured</p>
            <p className="text-xs text-slate-500 mt-1">Add repositories through the admin panel</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {repos.map((repo) => (
            <GitHubRepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

      {/* Info */}
      {repos.length > 0 && (
        <div className="text-xs text-slate-400 mt-8 pt-8 border-t border-slate-700">
          <p>
            Showing {repos.length} repositor{repos.length === 1 ? 'y' : 'ies'}. Click any card to visit the repository
            on GitHub.
          </p>
        </div>
      )}
    </div>
  )
}
