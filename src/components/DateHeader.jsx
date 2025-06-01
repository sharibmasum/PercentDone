import { useState, useEffect } from 'react'

export default function DateHeader() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-white mb-2">
        {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}
      </h1>
      <p className="text-gray-400 text-sm">
        {currentDateTime.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
    </div>
  )
} 