// src/hooks/useProgressData.js
// Custom hooks voor geoptimaliseerde data management

import { useState, useEffect, useCallback, useRef } from 'react'

// ===== DEBOUNCE HOOK =====
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// ===== INTERSECTION OBSERVER HOOK (voor lazy loading) =====
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef(null)
  
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )
    
    observer.observe(target)
    
    return () => observer.disconnect()
  }, [options])
  
  return [targetRef, isIntersecting]
}

// ===== LOCAL STORAGE CACHE HOOK =====
export function useLocalCache(key, initialValue) {
  // Get from local storage on mount
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error loading from cache:', error)
      return initialValue
    }
  })
  
  // Save to local storage when value changes
  const setCachedValue = useCallback((newValue) => {
    try {
      setValue(newValue)
      window.localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }, [key])
  
  return [value, setCachedValue]
}

// ===== PAGINATED DATA HOOK =====
export function usePaginatedData(fetchFunction, pageSize = 10) {
  const [data, setData] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    setError(null)
    
    try {
      const newData = await fetchFunction(page, pageSize)
      
      if (newData.length < pageSize) {
        setHasMore(false)
      }
      
      setData(prev => [...prev, ...newData])
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, page, pageSize, loading, hasMore])
  
  const reset = useCallback(() => {
    setData([])
    setPage(0)
    setHasMore(true)
    setError(null)
  }, [])
  
  return { data, loading, error, hasMore, loadMore, reset }
}

// ===== OPTIMISTIC UPDATE HOOK =====
export function useOptimisticUpdate(updateFunction) {
  const [optimisticData, setOptimisticData] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)
  
  const update = useCallback(async (newData, rollbackData) => {
    // Immediately update UI
    setOptimisticData(newData)
    setIsUpdating(true)
    setError(null)
    
    try {
      // Perform actual update
      await updateFunction(newData)
    } catch (err) {
      // Rollback on error
      setOptimisticData(rollbackData)
      setError(err)
    } finally {
      setIsUpdating(false)
    }
  }, [updateFunction])
  
  return { optimisticData, isUpdating, error, update }
}

// ===== PROGRESS DATA HOOK (Main data management) =====
export function useProgressData(client, db, options = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    cacheKey = `progress-${client?.id}`,
    timeRange = 30
  } = options
  
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: {
      weight: null,
      measurements: null,
      workouts: null,
      goals: null,
      achievements: null
    },
    lastUpdated: null
  })
  
  // Cache management
  const [cachedData, setCachedData] = useLocalCache(cacheKey, null)
  const refreshTimeoutRef = useRef(null)
  
  // Load data function
  const loadData = useCallback(async (useCache = true) => {
    if (!client?.id || !db) return
    
    // Use cached data if available and fresh
    if (useCache && cachedData && cachedData.lastUpdated) {
      const cacheAge = Date.now() - cachedData.lastUpdated
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        setState(prev => ({
          ...prev,
          loading: false,
          data: cachedData.data,
          lastUpdated: cachedData.lastUpdated
        }))
        return
      }
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Parallel data fetching
      const [
        goals,
        weightHistory,
        measurements,
        workoutProgress,
        achievements
      ] = await Promise.all([
        db.getClientGoals(client.id),
        db.getWeightHistory(client.id, timeRange),
        db.getMeasurementsHistory?.(client.id, timeRange) || Promise.resolve([]),
        db.getWorkoutProgress?.(client.id, timeRange) || Promise.resolve([]),
        db.getAchievements?.(client.id) || Promise.resolve([])
      ])
      
      const newData = {
        weight: {
          current: weightHistory[0]?.weight || null,
          history: weightHistory,
          goal: goals?.find(g => g.goal_type === 'weight')
        },
        measurements: measurements,
        workouts: workoutProgress,
        goals: goals,
        achievements: achievements
      }
      
      const newState = {
        loading: false,
        error: null,
        data: newData,
        lastUpdated: Date.now()
      }
      
      setState(newState)
      
      // Update cache
      setCachedData({
        data: newData,
        lastUpdated: Date.now()
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data'
      }))
    }
  }, [client?.id, db, timeRange, cachedData, setCachedData])
  
  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      loadData(false) // Don't use cache for auto-refresh
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadData])
  
  // Refresh function
  const refresh = useCallback(() => {
    return loadData(false)
  }, [loadData])
  
  // Update specific data optimistically
  const updateWeight = useCallback(async (weight) => {
    const rollback = state.data.weight
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        weight: {
          ...prev.data.weight,
          current: weight,
          history: [
            { weight, date: new Date().toISOString().split('T')[0] },
            ...(prev.data.weight?.history || [])
          ]
        }
      }
    }))
    
    try {
      await db.saveWeight(client.id, weight, new Date().toISOString().split('T')[0])
      refresh() // Reload full data
    } catch (error) {
      // Rollback
      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          weight: rollback
        }
      }))
      throw error
    }
  }, [client?.id, db, state.data.weight, refresh])
  
  return {
    ...state,
    refresh,
    updateWeight,
    updateMeasurements: (measurements) => {
      // Similar optimistic update pattern
    },
    updateGoal: (goalType, value) => {
      // Similar optimistic update pattern
    }
  }
}

// ===== VIRTUAL LIST HOOK (voor grote datasets) =====
export function useVirtualList(items, containerHeight, itemHeight) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  )
  
  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  }
}

// ===== PERFORMANCE MONITOR HOOK =====
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0)
  const renderTime = useRef(Date.now())
  
  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - renderTime.current
    renderTime.current = now
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current} (${timeSinceLastRender}ms since last)`)
    }
  })
  
  return {
    renderCount: renderCount.current,
    lastRenderTime: renderTime.current
  }
}
