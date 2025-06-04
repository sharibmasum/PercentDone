import { memo, useState, useEffect, useRef } from 'react'

export default memo(function ProgressBar({ progress, className = "", size = "sm" }) {
  const { completed, total } = progress
  const [displayProgress, setDisplayProgress] = useState({ completed, total })
  const lastValidProgress = useRef({ completed, total })
  const animationTimer = useRef(null)

  useEffect(() => {
    const newProgress = { completed, total }
    
    // Always update if we have valid data
    if (total >= 0 && completed >= 0) {
      // If this is a forward movement or first valid data, update immediately
      const currentPercentage = displayProgress.total > 0 ? (displayProgress.completed / displayProgress.total) * 100 : 0
      const newPercentage = total > 0 ? (completed / total) * 100 : 0
      
      // Update immediately for forward progress or if we don't have valid display data
      if (newPercentage >= currentPercentage || displayProgress.total === 0) {
        setDisplayProgress(newProgress)
        lastValidProgress.current = newProgress
      } else {
        // For backward movement, delay slightly to see if we get a corrective update
        if (animationTimer.current) {
          clearTimeout(animationTimer.current)
        }
        
        animationTimer.current = setTimeout(() => {
          // Only update if the data is still the same (not corrected)
          if (completed === progress.completed && total === progress.total) {
            setDisplayProgress(newProgress)
            lastValidProgress.current = newProgress
          }
        }, 100) // Short delay to catch rapid corrections
      }
    }

    // Cleanup timer on unmount
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current)
      }
    }
  }, [completed, total, progress])

  const progressPercentage = displayProgress.total > 0 ? Math.round((displayProgress.completed / displayProgress.total) * 100) : 0

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm"
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        <span className={`text-gray-400 ${textSizeClasses[size]}`}>
          {size === "md" ? "Today's Progress" : "Progress"}
        </span>
        <span className={`font-medium ${textSizeClasses[size]} ${
          progressPercentage === 100 ? 'text-green-400' : 
          progressPercentage > 0 ? 'text-yellow-400' : 'text-gray-500'
        }`}>
          {progressPercentage}% • {displayProgress.completed}/{displayProgress.total}
        </span>
      </div>
      <div className={`w-full bg-gray-700 rounded-full ${sizeClasses[size]} mt-2`}>
        <div 
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${
            progressPercentage === 100 ? 'bg-green-500' : 
            progressPercentage > 0 ? 'bg-yellow-500' : 'bg-gray-600'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}) 