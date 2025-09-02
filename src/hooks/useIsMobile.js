import { useState, useEffect } from 'react'

export default function useIsMobile() {
  // Keep hook for compatibility but make styling less restrictive
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    // Minimal resize handling - less aggressive updates
    let timeoutId = null
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(checkIsMobile, 200) // Slower updates
    }

    window.addEventListener('resize', throttledResize)
    
    return () => {
      window.removeEventListener('resize', throttledResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return isMobile
}
