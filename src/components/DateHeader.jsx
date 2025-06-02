import { useState, useEffect } from 'react'

export default function DateHeader({ date = new Date(), showTime = true }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    if (showTime) {
      const timer = setInterval(() => {
        setCurrentDateTime(new Date())
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showTime])

  // Use the passed date for display, but current time if showTime is true
  const displayDate = date
  const displayTime = showTime ? currentDateTime : date

  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-light text-white mb-1">
        {displayDate.toLocaleDateString('en-US', { weekday: 'long' })}
      </h1>
      <p className="text-gray-400 text-sm">
        {displayDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
    </div>
  )
} 