import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import Button from '../components/Button'
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
            <p className="text-gray-600">Your productivity insights for the past week</p>
          </div>

          {/* Back Button */}
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="secondary"
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>

          {/* Sign-in Required Message for Non-authenticated Users */}
          {!user ? (
            <div className="text-center py-12">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Require Sign-in</h2>
                <p className="text-gray-600 mb-6">
                  To view your productivity analytics and track your completion history, you need to sign in to PercentDone.
                </p>
                <div className="space-y-4">
                  <div className="text-left bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">What you'll get:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Weekly completion percentage charts</li>
                      <li>• Daily productivity breakdowns</li>
                      <li>• Historical performance tracking</li>
                      <li>• Progress insights and trends</li>
                    </ul>
                  </div>
                  <Button onClick={() => navigate('/login')} className="w-full">
                    Sign In to View Analytics
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading analytics...</p>
                </div>
              ) : (
                <>
                  {/* Weekly Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {weeklyStats.activeDays}
                      </div>
                      <div className="text-sm text-gray-600">Active Days</div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round(averageCompletion)}%
                      </div>
                      <div className="text-sm text-gray-600">Average Completion</div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {weeklyStats.totalTodos}
                      </div>
                      <div className="text-sm text-gray-600">Total Todos</div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <BarChart data={weeklyData} />

                  {/* Daily Breakdown */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
                    <div className="space-y-3">
                      {weeklyData.map((day) => {
                        const isToday = day.date === new Date().toISOString().split('T')[0]
                        return (
                          <div 
                            key={day.date} 
                            className={`flex justify-between items-center p-3 rounded ${
                              isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                            }`}
                          >
                            <div>
                              <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                                {day.dayName} {isToday && '(Today)'}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(day.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${
                                day.completion_percentage === 100 ? 'text-green-600' : 
                                day.completion_percentage > 0 ? 'text-yellow-600' : 'text-gray-400'
                              }`}>
                                {Math.round(day.completion_percentage)}%
                              </div>
                              <div className="text-xs text-gray-500">
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
        </div>
      </div>
    </div>
  )
} 