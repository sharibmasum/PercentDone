import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import DarkContainer from '../components/DarkContainer'
import DarkButton from '../components/DarkButton'
import AlertMessage from '../components/AlertMessage'
import BarChart from '../components/BarChart'

export default function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let data
        if (user) {
          // Authenticated user - load from database
          data = await todoOperations.getWeeklyAnalytics()
        } else {
          // Non-authenticated user - load from localStorage
          data = await todoOperations.getLocalWeeklyAnalytics()
        }
        
        setWeeklyData(data)
      } catch (err) {
        console.error('Error loading analytics:', err)
        setError('Failed to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user])

  // Calculate weekly summary stats
  const weeklyStats = weeklyData.reduce((acc, day) => {
    if (day.total_todos > 0) {
      acc.activeDays += 1
      acc.totalTodos += day.total_todos
      acc.completedTodos += day.completed_todos
    }
    return acc
  }, { activeDays: 0, totalTodos: 0, completedTodos: 0 })

  const averageCompletion = weeklyStats.activeDays > 0 
    ? (weeklyStats.completedTodos / weeklyStats.totalTodos) * 100 
    : 0

  return (
    <DarkContainer variant="auth">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-light text-white mb-2">📊 Analytics</h1>
        <p className="text-gray-400 text-sm">
          Your productivity insights for the past week
          {!user && ' (local data only)'}
        </p>
      </div>

      {/* Back Button */}
      <div className="mb-6">
        <DarkButton 
          onClick={() => navigate('/dashboard')} 
          variant="outline"
          className="w-auto"
        >
          ← Back to Dashboard
        </DarkButton>
      </div>

      {/* Analytics for All Users */}
      {error && (
        <AlertMessage type="error">
          {error}
        </AlertMessage>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Local Data Notice for Non-authenticated Users */}
          {!user && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-sm text-yellow-300">
                  <strong>Local Data Only:</strong> Your analytics are saved locally on this device. 
                  Sign in to save your data permanently and access it from any device.
                </p>
              </div>
              <div className="mt-3">
                <DarkButton 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-auto"
                >
                  Sign In to Save Data Permanently
                </DarkButton>
              </div>
            </div>
          )}

          {/* Weekly Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {weeklyStats.activeDays}
              </div>
              <div className="text-xs text-gray-400">Active Days</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(averageCompletion)}%
              </div>
              <div className="text-xs text-gray-400">Avg Completion</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {weeklyStats.totalTodos}
              </div>
              <div className="text-xs text-gray-400">Total Todos</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mb-6">
            <BarChart data={weeklyData} />
          </div>

          {/* Daily Breakdown */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>
            
            {weeklyData.length === 0 || weeklyData.every(day => day.total_todos === 0) ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">📊</div>
                <p className="text-gray-400 mb-2">No data yet!</p>
                <p className="text-sm text-gray-500">
                  Start adding and completing todos to see your analytics here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {weeklyData.map((day) => {
                  const isToday = day.date === new Date().toISOString().split('T')[0]
                  return (
                    <div 
                      key={day.date} 
                      className={`flex justify-between items-center p-3 rounded ${
                        isToday ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-gray-700'
                      }`}
                    >
                      <div>
                        <span className={`font-medium text-sm ${isToday ? 'text-blue-300' : 'text-white'}`}>
                          {day.dayName} {isToday && '(Today)'}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm ${
                          day.completion_percentage === 100 ? 'text-green-400' : 
                          day.completion_percentage > 0 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          {Math.round(day.completion_percentage)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {day.completed_todos}/{day.total_todos} todos
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Reset Data Option for Non-authenticated Users */}
          {!user && weeklyData.some(day => day.total_todos > 0) && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-600/50 rounded-lg">
              <h4 className="text-red-400 font-semibold mb-2 text-sm">Reset Local Data</h4>
              <p className="text-xs text-red-300 mb-3">
                This will permanently delete all your local analytics data. This action cannot be undone.
              </p>
              <DarkButton 
                onClick={() => {
                  if (confirm('Are you sure you want to delete all your local analytics data? This cannot be undone.')) {
                    localStorage.removeItem('dailyStats')
                    window.location.reload()
                  }
                }}
                variant="outline"
                className="text-red-400 border-red-600 hover:bg-red-900/30 text-sm"
              >
                Reset All Data
              </DarkButton>
            </div>
          )}
        </>
      )}
    </DarkContainer>
  )
} 