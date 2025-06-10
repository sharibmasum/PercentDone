import { useState, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import DarkContainer from '../components/ui/DarkContainer'
import DarkButton from '../components/ui/DarkButton'
import AlertMessage from '../components/ui/AlertMessage'
import BarChart from '../components/charts/BarChart'

const getUTCDateString = (date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  return utcDate.toISOString().split('T')[0]
}

function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAnalytics = async () => {
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

  useEffect(() => {
    loadAnalytics()
  }, [user])

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

  const todayString = getUTCDateString(new Date())

  return (
    <DarkContainer variant="auth">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-light text-white mb-2">📊 Analytics</h1>
        <p className="text-gray-400 text-sm">
          Your productivity insights for the past week
          {!user && ' (local data only)'}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <DarkButton 
          onClick={() => navigate('/dashboard')} 
          variant="outline"
          className="w-auto"
        >
          ← Back to Dashboard
        </DarkButton>
        
        <DarkButton 
          onClick={loadAnalytics}
          disabled={loading}
          variant="outline"
          className="w-auto"
        >
          {loading ? '↻ Refreshing...' : '↻ Refresh'}
        </DarkButton>
      </div>

      {error && (
        <AlertMessage type="error">
          {error}
        </AlertMessage>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {!user && (
            <div className="bg-blue-900/20 border border-blue-600/50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">ℹ️</span>
                <p className="text-sm text-blue-300">
                  <strong>Sign In Required:</strong> Analytics data is only available for authenticated users. 
                  Your todo completion percentages are saved to the database when you're signed in.
                </p>
              </div>
              <div className="mt-3">
                <DarkButton 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-auto"
                >
                  Sign In to View Analytics
                </DarkButton>
              </div>
            </div>
          )}

          {user && weeklyData.length > 0 && weeklyData.some(day => day.total_todos > 0) && (
            <div className="bg-green-900/20 border border-green-600/50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <p className="text-sm text-green-300">
                  <strong>Analytics Active:</strong> Your productivity data is being tracked 
                  and saved to the database automatically.
                </p>
              </div>
            </div>
          )}

          {user && weeklyData.length > 0 && weeklyData.every(day => day.total_todos === 0) && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">📈</span>
                <p className="text-sm text-yellow-300">
                  <strong>Getting Started:</strong> Add and complete some todos to see your 
                  productivity analytics here. Your data will be tracked automatically!
                </p>
              </div>
            </div>
          )}

          {user && weeklyData.length > 0 && (
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
          )}

          {user && weeklyData.length > 0 && (
            <>
              <div className="mb-6">
                <BarChart data={weeklyData} />
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>
                
                <div className="space-y-2">
                  {weeklyData.map((day) => {
                    const isToday = day.date === todayString
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
              </div>
            </>
          )}
        </>
      )}
    </DarkContainer>
  )
}

export default memo(Analytics) 