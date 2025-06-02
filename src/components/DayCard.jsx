import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { todoOperations } from '../lib/supabase'
import DateHeader from './DateHeader'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import ProgressIndicator from './ProgressIndicator'
import AlertMessage from './AlertMessage'

export default function DayCard({ date, isToday = false }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOrder, setSortOrder] = useState('earliest')

  const dateString = date.toISOString().split('T')[0]

  // Load todos for this specific date
  useEffect(() => {
    const loadTodos = async () => {
      if (!user) {
        // For non-authenticated users, check localStorage for this date
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
      
      if (user) {
        // Authenticated user - save to database for specific date
        const todo = await todoOperations.addTodoForDate(newTodo.trim(), dateString)
        
        if (todo && todo.id) {
          setTodos(prev => [todo, ...prev])
          setNewTodo('')
        }
      } else {
        // Non-authenticated user - save to localStorage for this specific date
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
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
        setNewTodo('')
      }
    } catch (err) {
      console.error('Error adding todo:', err)
      setError(err.message || 'Failed to add todo')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (id, completed) => {
    try {
      setError(null)
      
      if (user) {
        await todoOperations.toggleTodo(id, !completed)
      }
      
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      )
      setTodos(updatedTodos)
      
      if (!user) {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error updating todo:', err)
      setError('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      setError(null)
      
      if (user) {
        await todoOperations.deleteTodo(id)
      }
      
      const updatedTodos = todos.filter(todo => todo.id !== id)
      setTodos(updatedTodos)
      
      if (!user) {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error deleting todo:', err)
      setError('Failed to delete todo')
    }
  }

  const handleEditTodo = async (id, newTask) => {
    try {
      setError(null)
      
      if (user) {
        await todoOperations.updateTodo(id, { task: newTask })
      }
      
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, task: newTask } : todo
      )
      setTodos(updatedTodos)
      
      if (!user) {
        localStorage.setItem(`todos_${dateString}`, JSON.stringify(updatedTodos))
      }
    } catch (err) {
      console.error('Error editing todo:', err)
      setError('Failed to edit todo')
    }
  }

  // Sort todos
  const sortedTodos = [...todos].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    
    if (sortOrder === 'recent') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  return (
    <div className="flex-1">
      <div className="bg-gray-900 rounded-xl p-6 h-[700px] flex flex-col">
        <DateHeader date={date} showTime={isToday} />

        <TodoInput
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onSubmit={handleAddTodo}
          disabled={loading}
        />

        {error && (
          <AlertMessage type="error">
            {error}
          </AlertMessage>
        )}

        {/* Sort Controls */}
        {todos.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
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
            </div>
          </div>
        )}

        {/* Todo List - Scrollable within fixed container */}
        <div 
          className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 custom-scrollbar pr-3"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading...</p>
          ) : todos.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              No tasks yet
            </p>
          ) : (
            <div className="space-y-3">
              {sortedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                  onEdit={handleEditTodo}
                  showLocalTag={!user}
                />
              ))}
            </div>
          )}
        </div>

        <ProgressIndicator completed={completedCount} total={totalCount} />
      </div>
    </div>
  )
} 