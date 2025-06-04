import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'

export function useProgressTracking() {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState(new Map())
  const [optimisticProgress, setOptimisticProgress] = useState(new Map())
  const calculationCache = useRef(new Map())
  const debounceTimers = useRef(new Map())
  const updateProgressRef = useRef(null)

  const calculateProgress = useCallback(async (date) => {
    const dateString = date.toISOString().split('T')[0]
    const todayString = new Date().toISOString().split('T')[0]
    
    // Check cache first - use shorter cache for today's date
    const cacheKey = `${user?.id || 'local'}_${dateString}`
    const cached = calculationCache.current.get(cacheKey)
    const cacheTimeout = dateString === todayString ? 500 : 5000 // 0.5s for today, 5s for other days
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data
    }
    
    try {
      let todos = []
      
      if (!user) {
        todos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
      } else {
        todos = await todoOperations.getTodosByDate(dateString)
      }
      
      const completed = todos.filter(todo => todo.completed).length
      const total = todos.length
      const result = { completed, total }
      
      // Cache the result
      calculationCache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      console.error('Error calculating progress:', error)
      return { completed: 0, total: 0 }
    }
  }, [user])

  const updateProgress = useCallback(async (date) => {
    const dateString = date.toISOString().split('T')[0]
    const todayString = new Date().toISOString().split('T')[0]
    
    // Clear cache for this date to force recalculation
    const cacheKey = `${user?.id || 'local'}_${dateString}`
    calculationCache.current.delete(cacheKey)
    
    // For today's date, update immediately without debouncing for real-time feel
    if (dateString === todayString) {
      const progress = await calculateProgress(date)
      setProgressData(prev => new Map(prev.set(dateString, progress)))
      return
    }
    
    // Debounce multiple rapid updates for other dates
    const existingTimer = debounceTimers.current.get(dateString)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    const timer = setTimeout(async () => {
      const progress = await calculateProgress(date)
      setProgressData(prev => new Map(prev.set(dateString, progress)))
      debounceTimers.current.delete(dateString)
    }, 100) // 100ms debounce
    
    debounceTimers.current.set(dateString, timer)
  }, [calculateProgress, user])

  // Store the updateProgress function in ref for stable access
  updateProgressRef.current = updateProgress

  // New function for immediate optimistic progress updates
  const updateProgressOptimistically = useCallback((date, todos) => {
    const dateString = date.toISOString().split('T')[0]
    const completed = todos.filter(todo => todo.completed).length
    const total = todos.length
    const progress = { completed, total }
    
    // Update optimistic progress immediately
    setOptimisticProgress(prev => new Map(prev.set(dateString, progress)))
    
    // Clear the regular cache to ensure fresh data on next backend fetch
    const cacheKey = `${user?.id || 'local'}_${dateString}`
    calculationCache.current.delete(cacheKey)
    
    // Simplified backend sync - let the ProgressBar handle smoothing
    const todayString = new Date().toISOString().split('T')[0]
    const syncDelay = dateString === todayString ? 300 : 500 // Longer delays since ProgressBar smooths
    
    // Set a timer to sync with backend and clear optimistic state
    setTimeout(async () => {
      try {
        const actualProgress = await calculateProgress(date)
        
        // Set actual progress first
        setProgressData(prev => new Map(prev.set(dateString, actualProgress)))
        
        // Clear optimistic progress after a brief moment
        setOptimisticProgress(prev => {
          const updated = new Map(prev)
          updated.delete(dateString)
          return updated
        })
      } catch (error) {
        console.error('Error syncing progress:', error)
        // On error, don't clear optimistic progress to maintain UI consistency
      }
    }, syncDelay)
  }, [user, calculateProgress])

  const getProgress = useCallback((date) => {
    const dateString = date.toISOString().split('T')[0]
    
    // First check optimistic progress (most recent)
    const optimistic = optimisticProgress.get(dateString)
    if (optimistic) {
      return optimistic
    }
    
    // Then check regular progress data
    const existing = progressData.get(dateString)
    if (existing) {
      return existing
    }
    
    // If no cached data exists, trigger a calculation asynchronously
    // and return default immediately to prevent render blocking
    setTimeout(() => updateProgressRef.current?.(date), 0)
    return { completed: 0, total: 0 }
  }, [progressData, optimisticProgress])

  // Initialize progress data for commonly used dates
  useEffect(() => {
    const initializeProgress = async () => {
      const today = new Date()
      const dates = []
      
      // Initialize today and next few days
      for (let i = 0; i < 5; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
      
      const progressUpdates = new Map()
      
      // Batch load progress for multiple dates
      await Promise.all(dates.map(async (date) => {
        try {
          const progress = await calculateProgress(date)
          const dateString = date.toISOString().split('T')[0]
          progressUpdates.set(dateString, progress)
        } catch (error) {
          console.error('Error initializing progress for', date, error)
        }
      }))
      
      setProgressData(progressUpdates)
    }
    
    initializeProgress()
  }, [calculateProgress])

  useEffect(() => {
    if (!user) {
      const handleStorageChange = (e) => {
        if (e.key && e.key.startsWith('todos_')) {
          const dateString = e.key.replace('todos_', '')
          const date = new Date(dateString)
          if (!isNaN(date.getTime())) {
            updateProgress(date)
          }
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [user, updateProgress])

  useEffect(() => {
    const handleTodoUpdate = (event) => {
      const { date } = event.detail
      if (date) {
        updateProgress(new Date(date))
      }
    }

    const handleOptimisticTodoUpdate = (event) => {
      const { date, todos } = event.detail
      if (date && todos) {
        updateProgressOptimistically(new Date(date), todos)
      }
    }

    window.addEventListener('todoUpdated', handleTodoUpdate)
    window.addEventListener('todoUpdatedOptimistic', handleOptimisticTodoUpdate)
    return () => {
      window.removeEventListener('todoUpdated', handleTodoUpdate)
      window.removeEventListener('todoUpdatedOptimistic', handleOptimisticTodoUpdate)
    }
  }, [updateProgress, updateProgressOptimistically])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer))
      debounceTimers.current.clear()
    }
  }, [])

  return {
    getProgress,
    updateProgress,
    updateProgressOptimistically,
    progressData
  }
}

// Enhanced function for immediate progress updates
export function emitProgressUpdateOptimistic(date, todos) {
  const event = new CustomEvent('todoUpdatedOptimistic', {
    detail: { date: date.toISOString().split('T')[0], todos }
  })
  window.dispatchEvent(event)
}

export function emitProgressUpdate(date) {
  const event = new CustomEvent('todoUpdated', {
    detail: { date: date.toISOString().split('T')[0] }
  })
  window.dispatchEvent(event)
} 