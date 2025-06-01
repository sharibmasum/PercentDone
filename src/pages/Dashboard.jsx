import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import DarkContainer from '../components/DarkContainer'
import DateHeader from '../components/DateHeader'
import TodoInput from '../components/TodoInput'
import TodoItem from '../components/TodoItem'
import ProgressIndicator from '../components/ProgressIndicator'
import DarkButton from '../components/DarkButton'
import AlertMessage from '../components/AlertMessage'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <DarkContainer>
      <DateHeader />

      <TodoInput
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        onSubmit={handleAddTodo}
        disabled={loading}
      />

      {/* Error Message */}
      {error && (
        <AlertMessage type="error">
          {error}
        </AlertMessage>
      )}

      {/* Todo List */}
      <div className="space-y-3 mb-8">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading todos...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No tasks for today. Add one above!
          </p>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
              showLocalTag={!user}
            />
          ))
        )}
      </div>

      <ProgressIndicator completed={completedCount} total={totalCount} />

      {/* Bottom Actions */}
      <div className="space-y-3">
        <DarkButton
          onClick={() => navigate('/analytics')}
          variant="secondary"
        >
          📊 View Analytics
        </DarkButton>
        
        {user ? (
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">Logged in as {user.email}</p>
            <DarkButton
              onClick={handleSignOut}
              variant="outline"
            >
              Sign Out
            </DarkButton>
          </div>
        ) : (
          <>
            <DarkButton
              onClick={() => navigate('/login')}
              variant="primary"
            >
              Sign In to Save Todos
            </DarkButton>
            
            {/* Warning for non-authenticated users - moved to bottom */}
            <div className="text-center pt-2">
              <p className="text-xs text-yellow-400">
                ⚠️ Sign in to save your todos permanently
              </p>
            </div>
          </>
        )}
      </div>

      {/* Small Logo/Title at Bottom */}
      <div className="text-center mt-8 pt-4 border-t border-gray-800">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          📝 PercentDone - Created by Sharib Masum
        </p>
      </div>
    </DarkContainer>
  )
} 