import { useState, useEffect, memo } from 'react'

function DateHeader({ date = new Date(), showTime = false }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    if (showTime) {
      setCurrentDateTime(new Date())
      
    
      const timer = setInterval(() => {
        setCurrentDateTime(new Date())
      }, 30000) 

      return () => clearInterval(timer)
    }
  }, [showTime])

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
        {showTime && (
          <span className="ml-2 text-blue-400">
            {displayTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit'
            })} • Live
          </span>
        )}
      </p>
    </div>
  )
}

export default memo(DateHeader) 