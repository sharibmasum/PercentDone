import { useMemo } from 'react'

export function useDateGeneration() {
  const dates = useMemo(() => {
    const generateDates = (count) => {
      const dates = []
      const today = new Date()
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
      mobile: generateDates(7)
    }
  }, [
    new Date().toDateString()
  ])

  return dates
} 