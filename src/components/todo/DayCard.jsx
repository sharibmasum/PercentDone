import { useState, useEffect, useMemo, memo } from 'react'
import { useAuth } from '../../lib/auth'
import { todoOperations } from '../../lib/supabase'
import { useProgressTracking } from '../../hooks/useProgressTracking'
import DateHeader from '../layout/DateHeader'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import AlertMessage from '../ui/AlertMessage'
import { useMediaQuery } from 'react-responsive'

function DayCard({ 
  date, 
  isToday = false, 
  isFocused = true, 
  isMobile = false,
  mobileIndex, 
  handlePrev, 
  handleNext, 
  canGoPrev, 
  canGoNext,
  onProgressUpdate 
}) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [showMobileInput, setShowMobileInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOrder, setSortOrder] = useState('earliest')

  const isMobileQuery = useMediaQuery({ maxWidth: 767 })

  // Calculate progress from current todos state
  const progress = useProgressTracking(todos)

  // Update parent with progress whenever it changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(progress, isToday, isMobile)
    }
  }, [progress, isToday, isMobile, onProgressUpdate])

  const dateString = useMemo(() => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    return utcDate.toISOString().split('T')[0]
  }, [date])

  const today = useMemo(() => {
    const now = new Date()
    const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    return utcDate.toISOString().split('T')[0]
  }, [])

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

  useEffect(() => {
    const handleTodoUpdate = (event) => {
      const updateDate = event.detail?.date
      if (updateDate) {
        const updateDateString = new Date(updateDate).toISOString().split('T')[0]
        if (updateDateString === dateString) {
          const refreshTodos = async () => {
            if (!user) {
              const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
              setTodos(localTodos)
            } else {
              try {
                const data = await todoOperations.getTodosByDate(dateString)
                setTodos(data)
              } catch (err) {
                console.error('Error refreshing todos:', err)
              }
            }
          }
          refreshTodos()
        }
      }
    }

    window.addEventListener('todoUpdated', handleTodoUpdate)
    return () => window.removeEventListener('todoUpdated', handleTodoUpdate)
  }, [user, dateString])

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
        setShowMobileInput(false)
        
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
        setShowMobileInput(false)
        
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
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
    
    try {
      if (user) {
        await todoOperations.toggleTodo(id, !completed)
      } else {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error updating todo:', err)
    
      if (!user) {
        const localTodos = JSON.parse(localStorage.getItem(`todos_${dateString}`)) || []
        setTodos(localTodos)
      } else {
        setTodos(current => 
          current.map(todo => 
            todo.id === id ? { ...todo, completed } : todo
          )
        )
      }
    }
  }

  const handleDeleteTodo = async (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id)
    setTodos(updatedTodos)
    
    try {
      if (user) {
        await todoOperations.deleteTodo(id)
      } else {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error deleting todo:', err)
      // Revert on error
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
      }`} style={{ position: 'relative' }}>
        {/* Mobile: weekday with arrows */}
        {isMobileQuery ? (
          <div className="flex items-center justify-center mb-2 gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="p-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Previous Day"
              style={{ minWidth: 32, minHeight: 32 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="flex flex-col items-center mx-4">
              <span className="text-2xl font-light text-white">
                {date.toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              <span className="text-gray-400 text-sm flex items-center">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {isToday && isFocused && (
                  <span className="ml-3 text-blue-400">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Live
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="p-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Next Day"
              style={{ minWidth: 32, minHeight: 32 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        ) : (
          <DateHeader 
            date={date} 
            showTime={isToday && isFocused} 
          />
        )}

        {error && (
          <div className="mb-4">
            <AlertMessage type="error" message={error} />
          </div>
        )}

        {!isMobileQuery && (
          <TodoInput
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onSubmit={handleAddTodo}
            placeholder={isToday ? "What needs to be done today?" : "Add a task for this day..."}
            disabled={loading}
            isToday={isToday}
          />
        )}

        {isMobileQuery && (
          <div className="mb-4">
            {!showMobileInput ? (
              <button
                onClick={() => setShowMobileInput(true)}
                className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700 text-left
                         text-gray-400 hover:text-white hover:border-gray-600 transition-colors duration-200"
              >
                {isToday ? "What needs to be done today?" : "Add a task for this day..."}
              </button>
            ) : (
              <TodoInput
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onSubmit={(e) => {
                  handleAddTodo(e)
                  setShowMobileInput(false)
                }}
                onCancel={() => {
                  setShowMobileInput(false)
                  setNewTodo('')
                }}
                placeholder={isToday ? "What needs to be done today?" : "Add a task for this day..."}
                disabled={loading}
                autoFocus={true}
                showCancel={true}
                isToday={isToday}
              />
            )}
          </div>
        )}

        {todos.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-shrink-0 gap-4 mt-2">
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
      </div>
    </div>
  )
}

export default memo(DayCard) 