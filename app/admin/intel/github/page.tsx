'use client'

import { useState, useEffect } from 'react'
import { getGitHubSources } from '@/app/actions/github/github-sources'
import { GitHubRepoCard } from '@/app/components/github/github-repo-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function GitHubSourcesPage() {
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    const loadRepos = async () => {
      setLoading(true)
      const data = await getGitHubSources()
      setRepos(data)
      setLoading(false)
    }
    loadRepos()
  }, [])

  const totalPages = Math.ceil(repos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRepos = repos.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">GitHub Sources</h1>
        <p className="text-sm text-slate-400 mt-1">Security-related repositories and projects from GitHub</p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="text-center">
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      ) : repos.length === 0 ? (
        <div className="flex items-center justify-center min-h-96 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="text-center">
            <p className="text-slate-400">No GitHub sources configured</p>
            <p className="text-xs text-slate-500 mt-1">Add repositories through the admin panel</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentRepos.map((repo) => (
              <GitHubRepoCard key={repo.id} repo={repo} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700">
            <div className="text-xs text-slate-400">
              <p>
                Showing {startIndex + 1}–{Math.min(endIndex, repos.length)} of {repos.length} repositor
                {repos.length === 1 ? 'y' : 'ies'}
              </p>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        currentPage === page
                          ? 'bg-brand-600 text-slate-100'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
