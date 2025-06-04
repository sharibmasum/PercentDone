import { useState, useCallback } from 'react'

export function useMobileNavigation(maxIndex) {
  const [mobileIndex, setMobileIndex] = useState(0)

  const handlePrev = useCallback(() => {
    setMobileIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setMobileIndex(prev => Math.min(maxIndex - 1, prev + 1))
  }, [maxIndex])

  const canGoPrev = mobileIndex > 0
  const canGoNext = mobileIndex < maxIndex - 1

  return {
    mobileIndex,
    handlePrev,
    handleNext,
    canGoPrev,
    canGoNext
  }
} 