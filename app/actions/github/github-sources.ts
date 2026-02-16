'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'

export interface GitHubRepo {
  id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  custom_description: string | null
  stargazers_count: number
  description: string | null
  avatar_url: string | null
  updated_at: string
  pushed_at: string | null
}

/**
 * Fetch GitHub repo data from GitHub API
 */
async function fetchGitHubRepoData(
  owner: string,
  repo: string
): Promise<{
  stargazers_count: number
  description: string | null
  avatar_url: string | null
  pushed_at: string | null
} | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_API_TOKEN && {
          Authorization: `token ${process.env.GITHUB_API_TOKEN}`,
        }),
      },
    })

    if (!response.ok) {
      console.error(`[GitHub API] Error fetching ${owner}/${repo}:`, response.status)
      return null
    }

    const data = await response.json()

    return {
      stargazers_count: data.stargazers_count || 0,
      description: data.description || null,
      avatar_url: data.owner?.avatar_url || null,
      pushed_at: data.pushed_at || null,
    }
  } catch (error) {
    console.error(`[GitHub API] Exception fetching ${owner}/${repo}:`, error)
    return null
  }
}

/**
 * Get all active GitHub sources with real-time GitHub data
 */
export async function getGitHubSources(): Promise<GitHubRepo[]> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    // Get active repos from database
    const { data, error } = await supabase
      .from('github_sources')
      .select('*')
      .eq('is_active', true)
      .order('added_at', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array with helpful error
      if (error.code === 'PGRST204' || error.message?.includes('Could not find the table')) {
        console.warn('[getGitHubSources] GitHub sources table not initialized. Run migration: 20260216006000_create_github_sources.sql')
        return []
      }
      console.error('[getGitHubSources] Database error:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Fetch live data from GitHub API for each repo
    const repos = await Promise.all(
      data.map(async (source) => {
        const githubData = await fetchGitHubRepoData(source.repo_owner, source.repo_name)

        return {
          id: source.id,
          repo_url: source.repo_url,
          repo_owner: source.repo_owner,
          repo_name: source.repo_name,
          custom_description: source.custom_description,
          stargazers_count: githubData?.stargazers_count || 0,
          description: githubData?.description || null,
          avatar_url: githubData?.avatar_url || null,
          updated_at: source.updated_at,
          pushed_at: githubData?.pushed_at || null,
        } as GitHubRepo
      })
    )

    return repos
  } catch (error) {
    console.error('[getGitHubSources] Exception:', error)
    return []
  }
}

/**
 * Add a new GitHub source repository
 */
export async function addGitHubSource(
  repoUrl: string,
  customDescription?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate URL format
    const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!urlMatch) {
      return { success: false, error: 'Invalid GitHub URL format' }
    }

    const [, owner, repo] = urlMatch

    const supabase = await createServerSupabaseAnonClient()

    const { error } = await supabase.from('github_sources').insert({
      repo_url: repoUrl,
      repo_owner: owner,
      repo_name: repo,
      custom_description: customDescription || null,
    })

    if (error) {
      console.error('[addGitHubSource] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[addGitHubSource] Exception:', error)
    return { success: false, error: message }
  }
}

/**
 * Remove a GitHub source repository
 */
export async function removeGitHubSource(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { error } = await supabase.from('github_sources').delete().eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
