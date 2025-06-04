import { useMemo } from 'react'

export function useDateGeneration() {
  const dates = useMemo(() => {
    const generateDates = (count) => {
      const dates = []
      const today = new Date()
      // Set time to midnight to ensure consistent date comparisons
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < count; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
      
      return dates
    }

    return {
      desktop: generateDates(5), 
      tablet: generateDates(3),  
      mobile: generateDates(7)  // Reduced from 14 to 7 for better performance
    }
  }, [
    // Only regenerate dates when the day changes
    new Date().toDateString()
  ])

  return dates
} 