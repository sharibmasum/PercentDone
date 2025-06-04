import { useState, useEffect, useMemo, memo } from 'react'
import { useAuth } from '../../lib/auth'
import { todoOperations } from '../../lib/supabase'
import { emitProgressUpdateOptimistic } from '../../hooks/useProgressTracking'
import DateHeader from '../layout/DateHeader'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import AlertMessage from '../ui/AlertMessage'

function DayCard({ date, isToday = false, isFocused = true }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOrder, setSortOrder] = useState('earliest')

  const dateString = useMemo(() => date.toISOString().split('T')[0], [date])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    const loadTodos = async () => {
      if (!user) {
        const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
        setTodos(localTodos)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await todoOperations.getTodosByDate(dateString)
        setTodos(data)
      } catch (err) {
        console.error('Error loading todos:', err)
        setError('Failed to load todos')
      } finally {
        setLoading(false)
      }
    }

    loadTodos()
  }, [user, dateString])

  // Add listener for todo updates from other viewport instances
  // Only listen for real-time updates if this card is focused
  useEffect(() => {
    if (!isFocused) return // Don't listen for updates if not focused

    const handleTodoUpdated = (event) => {
      const updatedDate = event.detail.date
      if (updatedDate === dateString) {
        // Only reload if this card's date was updated
        if (!user) {
          const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
          setTodos(localTodos)
        } else {
          // For authenticated users, reload from database
          todoOperations.getTodosByDate(dateString)
            .then(data => {
              setTodos(data)
            })
            .catch(err => console.error('Error reloading todos:', err))
        }
      }
    }

    window.addEventListener('todoUpdated', handleTodoUpdated)
    return () => window.removeEventListener('todoUpdated', handleTodoUpdated)
  }, [user, dateString, isFocused])

  const handleAddTodo = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!newTodo.trim()) {
      setError('Please enter a todo task')
      setTimeout(() => setError(null), 3000) 
      return
    }

    try {
      setError(null)
      
      if (user) {
        const optimisticTodo = {
          id: `temp_${Date.now()}`,
          task: newTodo.trim(),
          completed: false,
          created_at: new Date().toISOString(),
          todo_date: dateString,
          optimistic: true
        }
        
        const optimisticTodos = [optimisticTodo, ...todos]
        setTodos(optimisticTodos)
        setNewTodo('')
        
        emitProgressUpdateOptimistic(date, optimisticTodos)
        
        todoOperations.addTodo(newTodo.trim(), dateString)
          .then(realTodo => {
            setTodos(current => 
              current.map(todo => 
                todo.id === optimisticTodo.id ? realTodo : todo
              )
            )
          })
          .catch(err => {
            console.error('Error adding todo:', err)
            setTodos(current => current.filter(todo => todo.id !== optimisticTodo.id))
            setError('Failed to save todo. Please try again.')
            setTimeout(() => setError(null), 5000)
          })
          
      } else {
        const localTodo = {
          id: Date.now(),
          task: newTodo.trim(),
          completed: false,
          created_at: new Date().toISOString(),
          todo_date: dateString,
          local: true
        }
        
        const updatedTodos = [localTodo, ...todos]
        setTodos(updatedTodos)
        setNewTodo('')
        
        emitProgressUpdateOptimistic(date, updatedTodos)
        
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
        
        if (dateString === today) {
          todoOperations.saveDailyTrackingStats(dateString, updatedTodos).catch(() => {
          })
        }
        
        window.dispatchEvent(new CustomEvent('todoUpdated', {
          detail: { date: dateString, type: 'add' }
        }))
      }
    } catch (err) {
      console.error('Error adding todo:', err)
      setError('Failed to add todo')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleToggleTodo = async (id, completed) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !completed } : todo
    )
    setTodos(updatedTodos)
    
    emitProgressUpdateOptimistic(date, updatedTodos)
    
    try {
      if (user) {
        await todoOperations.toggleTodo(id, !completed)
      } else {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
        
        if (dateString === today) {
          todoOperations.saveDailyTrackingStats(dateString, updatedTodos).catch(() => {
          })
        }
      }

      window.dispatchEvent(new CustomEvent('todoUpdated', {
        detail: { date: dateString, type: 'toggle' }
      }))
    } catch (err) {
      console.error('Error updating todo:', err)
      if (!user) {
        const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
        setTodos(localTodos)
      }
    }
  }

  const handleDeleteTodo = async (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id)
    setTodos(updatedTodos)
    
    emitProgressUpdateOptimistic(date, updatedTodos)
    
    try {
      if (user) {
        await todoOperations.deleteTodo(id)
      } else {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
        
        if (dateString === today) {
          todoOperations.saveDailyTrackingStats(dateString, updatedTodos).catch(() => {
          })
        }
      }
      
      window.dispatchEvent(new CustomEvent('todoUpdated', {
        detail: { date: dateString, type: 'delete' }
      }))
    } catch (err) {
      console.error('Error deleting todo:', err)
      if (!user) {
        const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
        setTodos(localTodos)
      }
    }
  }

  const handleEditTodo = async (id, newTask) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, task: newTask } : todo
    )
    setTodos(updatedTodos)
    
    try {
      if (user) {
        await todoOperations.updateTodo(id, { task: newTask })
      } else {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error editing todo:', err)
      if (!user) {
        const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
        setTodos(localTodos)
      }
    }
  }

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      
      if (sortOrder === 'recent') {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })
  }, [todos, sortOrder])

  const totalCount = todos.length

  return (
    <div className={`h-full transition-all duration-200 ${
      isFocused ? '' : 'opacity-90'
    }`}>
      <div className={`bg-gray-900 rounded-xl p-6 h-full flex flex-col min-h-0 ${
        isFocused ? 'border border-gray-700' : 'border border-gray-800'
      }`}>
        <DateHeader 
          date={date} 
          showTime={isToday && isFocused} 
        />

        <TodoInput
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onSubmit={handleAddTodo}
          disabled={false} 
        />

        {error && (
          <AlertMessage type="error">
            {error}
          </AlertMessage>
        )}

        {todos.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600
                         focus:outline-none focus:border-blue-500"
              >
                <option value="earliest">Earliest</option>
                <option value="recent">Recent</option>
              </select>
            </div>
            <div className="text-sm text-gray-400">
              {totalCount} task{totalCount !== 1 ? 's' : ''}
              {!isFocused && <span className="text-gray-600 ml-2">👁️</span>}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0">
          {loading && todos.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : sortedTodos.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-gray-400">
                {isToday ? "No tasks yet - start your day!" : "No tasks for this day"}
              </div>
            </div>
          ) : (
            sortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onEdit={handleEditTodo}
                showLocalTag={!user}
                isToday={isToday}
              />
            ))
          )}
        </div>
        
        {!isFocused && totalCount > 0 && (
          <div className="text-center pt-2 border-t border-gray-800 mt-2 flex-shrink-0">
            <div className="text-xs text-gray-600">
              Click to focus for real-time updates
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(DayCard) 