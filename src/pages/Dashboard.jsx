import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import Button from '../components/Button'
import Input from '../components/Input'
import ProgressBar from '../components/ProgressBar'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Update current date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load todos when user changes
  useEffect(() => {
    const loadTodos = async () => {
      if (!user) {
        // For non-authenticated users, start with empty todos (local only)
        setTodos([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await todoOperations.getTodos()
        setTodos(data)
      } catch (err) {
        console.error('Error loading todos:', err)
        setError('Failed to load todos. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadTodos()
  }, [user])

  // Initialize database once on component mount (only if user is signed in)
  useEffect(() => {
    const initializeOnce = async () => {
      if (!user) return // Skip initialization for non-authenticated users
      
      try {
        await todoOperations.initialize()
      } catch (err) {
        console.error('Error initializing database:', err)
        setError('Failed to initialize database. Please refresh the page.')
      }
    }

    initializeOnce()
  }, [user])

  // Save daily stats at midnight (only for authenticated users)
  useEffect(() => {
    if (!user) return // Skip for non-authenticated users
    
    const checkMidnight = () => {
      const now = new Date()
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        todoOperations.saveDailyStats().catch(console.error)
      }
    }

    const timer = setInterval(checkMidnight, 1000)
    return () => clearInterval(timer)
  }, [user])

  const handleAddTodo = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!newTodo.trim()) {
      setError('Please enter a todo task')
      return
    }

    try {
      setError(null)
      setLoading(true)
      
      console.log('Attempting to add todo:', newTodo.trim())
      
      if (user) {
        // Authenticated user - save to database
        const todo = await todoOperations.addTodo(newTodo.trim())
        console.log('Todo added successfully:', todo)
        
        if (todo && todo.id) {
          setTodos(prev => [todo, ...prev])
          setNewTodo('')
          console.log('Todo added to UI state')
          
          // Save daily stats after adding todo
          try {
            await todoOperations.saveDailyStats()
            console.log('Daily stats saved after adding todo')
          } catch (statsError) {
            console.error('Error saving daily stats:', statsError)
          }
        } else {
          throw new Error('Todo was not returned properly from database')
        }
      } else {
        // Non-authenticated user - local only
        const localTodo = {
          id: Date.now(), // Use timestamp as temporary ID
          task: newTodo.trim(),
          completed: false,
          created_at: new Date().toISOString(),
          local: true // Mark as local todo
        }
        
        setTodos(prev => [localTodo, ...prev])
        setNewTodo('')
        console.log('Local todo added:', localTodo)
      }
    } catch (err) {
      console.error('Error in handleAddTodo:', err)
      
      // Handle specific error cases
      if (err.code === '23505') {
        setError('You already have a todo with this task for today.')
      } else if (err.message.includes('Must be logged in')) {
        setError('Please log in to save todos to the database.')
      } else if (err.code === '42501') {
        setError('Permission denied. Please check your account permissions.')
      } else {
        setError(err.message || 'Failed to add todo. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (id, completed) => {
    try {
      setError(null)
      console.log('Toggling todo:', id, 'from', completed, 'to', !completed)
      
      if (user) {
        // Authenticated user - update in database
        await todoOperations.toggleTodo(id, !completed)
        
        // Save daily completion stats after the toggle
        try {
          await todoOperations.saveDailyStats()
          console.log('Daily stats saved after toggle')
        } catch (statsError) {
          console.error('Error saving daily stats:', statsError)
        }
      }
      
      // Update local state for both authenticated and non-authenticated users
      setTodos(prev => {
        const updated = prev.map(todo => 
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
        console.log('Updated todos:', updated)
        return updated
      })
      
    } catch (err) {
      console.error('Error updating todo:', err)
      setError('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      setError(null)
      console.log('Deleting todo:', id)
      
      if (user) {
        // Authenticated user - delete from database
        await todoOperations.deleteTodo(id)
        
        // Save daily stats after deleting todo
        try {
          await todoOperations.saveDailyStats()
          console.log('Daily stats saved after deleting todo')
        } catch (statsError) {
          console.error('Error saving daily stats:', statsError)
        }
      }
      
      // Update local state for both authenticated and non-authenticated users
      setTodos(prev => prev.filter(todo => todo.id !== id))
      
    } catch (err) {
      console.error('Error deleting todo:', err)
      setError('Failed to delete todo')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
    }
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">PercentDone</h1>
              {user ? (
                <>
                  <p className="text-sm text-gray-500">
                    Logged in as {user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(currentDateTime)} {formatTime(currentDateTime)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    {formatDate(currentDateTime)} {formatTime(currentDateTime)}
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ PercentDone can't save your todo items unless you sign in
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Today's Progress */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Today's Progress</h2>
                <span className="text-sm text-gray-600">
                  {Math.round(completionPercentage)}% ({completedCount}/{totalCount})
                </span>
              </div>
              <ProgressBar completed={completedCount} total={totalCount} />
            </div>

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="space-y-4" noValidate>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a new todo..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" className="whitespace-nowrap" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Todo'}
                </Button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Todo List */}
            <div className="space-y-2">
              {loading ? (
                <p className="text-center text-gray-500">Loading todos...</p>
              ) : todos.length === 0 ? (
                <p className="text-center text-gray-500">
                  No todos for today. Add one above!
                </p>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id, todo.completed)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {todo.task}
                        {!user && todo.local && (
                          <span className="ml-2 text-xs text-yellow-600">(local)</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Analytics and Auth Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/analytics')}
                className="w-full"
              >
                📊 View Analytics
              </Button>
              
              {user ? (
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  className="w-full"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  variant="secondary"
                  className="w-full"
                >
                  Sign In to Save Todos
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 