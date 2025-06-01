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
      if (!user) {
        // Don't redirect, just show sign-in message
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await todoOperations.getWeeklyAnalytics()
        setWeeklyData(data)
      } catch (err) {
        console.error('Error loading analytics:', err)
        setError('Failed to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user, navigate])

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
    <DarkContainer className="max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-white mb-2">📊 Analytics</h1>
        <p className="text-gray-400 text-sm">Your productivity insights for the past week</p>
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

      {/* Sign-in Required Message for Non-authenticated Users */}
      {!user ? (
        <div className="text-center py-12">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-4">Analytics Require Sign-in</h2>
            <p className="text-gray-400 mb-6">
              To view your productivity analytics and track your completion history, you need to sign in to PercentDone.
            </p>
            <div className="space-y-4">
              <div className="text-left bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="font-semibold text-white mb-2">What you'll get:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Weekly completion percentage charts</li>
                  <li>• Daily productivity breakdowns</li>
                  <li>• Historical performance tracking</li>
                  <li>• Progress insights and trends</li>
                </ul>
              </div>
              <DarkButton onClick={() => navigate('/login')}>
                Sign In to View Analytics
              </DarkButton>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <AlertMessage type="error">
              {error}
            </AlertMessage>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Weekly Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {weeklyStats.activeDays}
                  </div>
                  <div className="text-sm text-gray-400">Active Days</div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {Math.round(averageCompletion)}%
                  </div>
                  <div className="text-sm text-gray-400">Average Completion</div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {weeklyStats.totalTodos}
                  </div>
                  <div className="text-sm text-gray-400">Total Todos</div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mb-8">
                <BarChart data={weeklyData} />
              </div>

              {/* Daily Breakdown */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>
                <div className="space-y-3">
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
                          <span className={`font-medium ${isToday ? 'text-blue-300' : 'text-white'}`}>
                            {day.dayName} {isToday && '(Today)'}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">
                            {new Date(day.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
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
              </div>
            </>
          )}
        </>
      )}
    </DarkContainer>
  )
} 