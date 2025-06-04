import { useState, useEffect, useMemo, memo } from 'react'
import { useAuth } from '../../lib/auth'
import { todoOperations } from '../../lib/supabase'
import { emitProgressUpdateOptimistic } from '../../hooks/useProgressTracking'
import DateHeader from '../layout/DateHeader'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import AlertMessage from '../ui/AlertMessage'
import { useMediaQuery } from 'react-responsive'

function DayCard({ date, isToday = false, isFocused = true, mobileIndex, handlePrev, handleNext, canGoPrev, canGoNext }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [showMobileInput, setShowMobileInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOrder, setSortOrder] = useState('earliest')

  const isMobile = useMediaQuery({ maxWidth: 767 })

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

  useEffect(() => {
    if (!isFocused) return 

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
        setShowMobileInput(false)
        
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
        setShowMobileInput(false)
        
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
      }`} style={{ position: 'relative' }}>
        {/* Mobile: weekday with arrows */}
        {isMobile ? (
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
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        ) : (
          <DateHeader 
            date={date} 
            showTime={isToday && isFocused} 
          />
        )}

        {/* Desktop/Tablet: show normal input */}
        {!isMobile && (
          <TodoInput
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onSubmit={handleAddTodo}
            disabled={false} 
          />
        )}

        {/* Mobile: show floating + button and compact input bar */}
        {isMobile && !showMobileInput && (
          <button
            className="fixed z-20 bottom-[100px] right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md bg-opacity-90 border-2 border-blue-500"
            onClick={() => setShowMobileInput(true)}
            aria-label="Add Task"
            style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        )}
        {isMobile && showMobileInput && (
          <form
            onSubmit={handleAddTodo}
            className="fixed z-30 bottom-[100px] left-0 right-0 px-4"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center rounded-2xl shadow-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 px-3 py-2 gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 border-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none text-base px-2 transition-shadow"
                style={{ boxShadow: 'none' }}
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 text-sm font-semibold shadow-md transition-colors duration-150"
              >
                Add
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-200 p-2 rounded-full transition-colors duration-150"
                onClick={() => setShowMobileInput(false)}
                aria-label="Cancel"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </form>
        )}

        {error && (
          <AlertMessage type="error">
            {error}
          </AlertMessage>
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