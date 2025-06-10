import { memo, useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { todoOperations } from '../../lib/supabase'

const getUTCDateString = (date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  return utcDate.toISOString().split('T')[0]
}

export default memo(function ProgressBar({ progress, className = "", size = "sm", isToday = false }) {
  const { user } = useAuth()
  const { completed, total } = progress
  const [displayProgress, setDisplayProgress] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    if (total >= 0 && completed >= 0) {
      setDisplayProgress({ completed, total })
    }
  }, [completed, total])

  const progressPercentage = displayProgress.total > 0 ? Math.round((displayProgress.completed / displayProgress.total) * 100) : 0

  useEffect(() => {
    const saveToDatabase = async () => {
      if (user && isToday && displayProgress.total >= 0 && displayProgress.completed >= 0) {
        try {
          const today = getUTCDateString(new Date())
          await todoOperations.saveToDailyTracker(today, {
            total_todos: displayProgress.total,
            completed_todos: displayProgress.completed,
            completion_percentage: progressPercentage
          })
        } catch (error) {
          console.error('Error saving to daily_tracker:', error)
        }
      }
    }

    saveToDatabase()
  }, [user, isToday, displayProgress.total, displayProgress.completed, progressPercentage])

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
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${
            progressPercentage === 100 ? 'bg-green-500' : 
            progressPercentage > 0 ? 'bg-yellow-500' : 'bg-gray-600'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}) 