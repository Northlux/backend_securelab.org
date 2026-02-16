'use client'

import { ExternalLink, Star } from 'lucide-react'
import type { GitHubRepo } from '@/app/actions/github/github-sources'

interface GitHubRepoCardProps {
  repo: GitHubRepo
}

export function GitHubRepoCard({ repo }: GitHubRepoCardProps) {
  const repoImage = repo.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'

  return (
    <a
      href={repo.repo_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden hover:border-cyan-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Repository Image - Compact */}
      <div className="relative w-full h-40 bg-slate-900 overflow-hidden">
        <img
          src={repoImage}
          alt={`${repo.repo_owner}/${repo.repo_name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Content - Compact */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        {/* Repository Name */}
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{repo.repo_owner}</p>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
            {repo.repo_name}
          </h3>
        </div>

        {/* Description - Compact */}
        <div className="flex-1">
          <p className="text-xs text-slate-300 line-clamp-2">
            {repo.custom_description || repo.description || 'No description available'}
          </p>
        </div>

        {/* Footer - Minimal */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {/* Stars */}
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500" />
              <span>{repo.stargazers_count.toLocaleString()}</span>
            </div>

            {/* Updated Date */}
            <div>
              {new Date(repo.pushed_at || repo.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* External Link Icon */}
          <ExternalLink size={12} className="text-slate-400 group-hover:text-cyan-300 transition-colors" />
        </div>
      </div>
    </a>
  )
}
