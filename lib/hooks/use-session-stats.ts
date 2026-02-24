'use client'

import { useState, useEffect, useCallback } from 'react'

interface SessionStats {
  signalsReviewed: number
  approved: number
  rejected: number
  skipped: number
  startTime: number
  totalTime: number // milliseconds
  averageTimePerSignal: number // seconds
  signalsPerMinute: number
}

const STORAGE_KEY = 'intel-queue-session-stats'

function loadStats(): SessionStats {
  if (typeof window === 'undefined') {
    return getDefaultStats()
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if session is from today
      const today = new Date().toDateString()
      const sessionDate = new Date(parsed.startTime).toDateString()
      
      if (today === sessionDate) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Failed to load session stats:', error)
  }
  
  return getDefaultStats()
}

function getDefaultStats(): SessionStats {
  return {
    signalsReviewed: 0,
    approved: 0,
    rejected: 0,
    skipped: 0,
    startTime: Date.now(),
    totalTime: 0,
    averageTimePerSignal: 0,
    signalsPerMinute: 0,
  }
}

function saveStats(stats: SessionStats) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Failed to save session stats:', error)
  }
}

export function useSessionStats() {
  const [stats, setStats] = useState<SessionStats>(getDefaultStats)
  const [lastActionTime, setLastActionTime] = useState<number>(Date.now())
  
  // Load from localStorage on mount
  useEffect(() => {
    setStats(loadStats())
  }, [])
  
  // Auto-update total time and calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const now = Date.now()
        const totalTime = now - prev.startTime
        const totalMinutes = totalTime / 60000
        
        const newStats = {
          ...prev,
          totalTime,
          averageTimePerSignal: prev.signalsReviewed > 0 
            ? totalTime / prev.signalsReviewed / 1000 
            : 0,
          signalsPerMinute: totalMinutes > 0 
            ? prev.signalsReviewed / totalMinutes 
            : 0,
        }
        
        saveStats(newStats)
        return newStats
      })
    }, 1000) // Update every second
    
    return () => clearInterval(interval)
  }, [])
  
  const recordAction = useCallback((action: 'approve' | 'reject' | 'skip') => {
    setStats(prev => {
      const now = Date.now()
      const totalTime = now - prev.startTime
      const signalsReviewed = prev.signalsReviewed + 1
      const totalMinutes = totalTime / 60000
      
      const newStats = {
        ...prev,
        signalsReviewed,
        approved: action === 'approve' ? prev.approved + 1 : prev.approved,
        rejected: action === 'reject' ? prev.rejected + 1 : prev.rejected,
        skipped: action === 'skip' ? prev.skipped + 1 : prev.skipped,
        totalTime,
        averageTimePerSignal: totalTime / signalsReviewed / 1000,
        signalsPerMinute: totalMinutes > 0 ? signalsReviewed / totalMinutes : 0,
      }
      
      saveStats(newStats)
      return newStats
    })
    
    setLastActionTime(Date.now())
  }, [])
  
  const resetStats = useCallback(() => {
    const newStats = getDefaultStats()
    setStats(newStats)
    saveStats(newStats)
    setLastActionTime(Date.now())
  }, [])
  
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
  
  return {
    stats,
    recordAction,
    resetStats,
    formatTime,
    lastActionTime,
  }
}
