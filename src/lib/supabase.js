import { createClient } from '@supabase/supabase-js'

// Import the progress update emitter
const emitProgressUpdate = (date) => {
  const event = new CustomEvent('todoUpdated', { detail: { date } })
  window.dispatchEvent(event)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const todoOperations = {
  // Get todos for the current day
  async getTodosToday() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('todo_date', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching today\'s todos:', error)
      return []
    }

    return data || []
  },

  async getTodosByDate(dateString) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('todo_date', dateString)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos by date:', error)
      return []
    }

    return data || []
  },

  async addTodo(task, dateString) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      throw userError
    }

    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          task: task.trim(),
          completed: false,
          user_id: user.id,
          todo_date: dateString
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error adding todo:', error)
      throw error
    }

    // Update local storage and emit progress update
    const allTodosForDate = await this.getTodosByDate(dateString)
    localStorage.setItem(`todos_${dateString}`, JSON.stringify(allTodosForDate))
    
    // Save daily tracking stats
    await this.saveDailyTrackingStats(dateString, allTodosForDate)
    
    // Emit progress update
    emitProgressUpdate(new Date(dateString))
    
    return data
  },

  async updateTodo(id, updates) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating todo:', error)
      throw error
    }

    // Update local storage and emit progress update
    const todoDate = data.todo_date
    const allTodosForDate = await this.getTodosByDate(todoDate)
    localStorage.setItem(`todos_${todoDate}`, JSON.stringify(allTodosForDate))
    
    // Save daily tracking stats
    await this.saveDailyTrackingStats(todoDate, allTodosForDate)
    
    // Emit progress update
    emitProgressUpdate(new Date(todoDate))
    
    return data
  },

  async deleteTodo(id) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // First get the todo to find its date
    const { data: todoToDelete } = await supabase
      .from('todos')
      .select('todo_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting todo:', error)
      throw error
    }

    // Update local storage and emit progress update
    const todoDate = todoToDelete.todo_date
    const allTodosForDate = await this.getTodosByDate(todoDate)
    localStorage.setItem(`todos_${todoDate}`, JSON.stringify(allTodosForDate))
    
    // Save daily tracking stats
    await this.saveDailyTrackingStats(todoDate, allTodosForDate)
    
    // Emit progress update
    emitProgressUpdate(new Date(todoDate))

    return true
  },

  async toggleTodo(id, completed) {
    const result = await this.updateTodo(id, { completed })
    return result
  },

  // Clear all todos from previous days (before today)
  async clearPreviousDaysTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('user_id', user.id)
      .lt('todo_date', today)

    if (error) {
      console.error('Error clearing previous days todos from database:', error)
    }

    // Also clear from localStorage
    const allDates = this.getAllStoredDates()
    
    for (const dateString of allDates) {
      if (dateString < today) {
        localStorage.removeItem(`todos_${dateString}`)
      }
    }

    // Clean up old daily stats but keep recent ones
    const existingStats = JSON.parse(localStorage.getItem('dailyStats') || '[]')
    const recentStats = existingStats.filter(stat => stat.date >= today)
    localStorage.setItem('dailyStats', JSON.stringify(recentStats))
  },

  // Helper function to get all stored dates from localStorage
  getAllStoredDates() {
    const dates = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('todos_')) {
        const dateString = key.replace('todos_', '')
        dates.push(dateString)
      }
    }
    return dates
  },

  // Save daily tracking stats to database (for authenticated users)
  async saveDailyTrackingStats(dateString, todos) {
    const totalTodos = todos.length
    const completedTodos = todos.filter(todo => todo.completed).length
    const completionPercentage = totalTodos > 0
      ? Math.round((completedTodos / totalTodos) * 100)
      : 0

    const statData = {
      date: dateString,
      total_todos: totalTodos,
      completed_todos: completedTodos,
      completion_percentage: completionPercentage
    }

    // Save to localStorage
    const existingStats = JSON.parse(localStorage.getItem('dailyStats') || '[]')
    
    // Remove any existing entry for this date
    const filteredStats = existingStats.filter(stat => stat.date !== dateString)
    
    // Add the new stat
    filteredStats.push(statData)
    
    // Keep only recent stats (last 30 days)
    const recentStats = filteredStats.slice(0, 30)
    
    localStorage.setItem('dailyStats', JSON.stringify(recentStats))

    // Also save to database if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const targetDate = dateString || new Date().toISOString().split('T')[0]
        
        const totalTodos = todos.length
        const completedTodos = todos.filter(todo => todo.completed).length
        const completionPercentage = totalTodos > 0
          ? Math.round((completedTodos / totalTodos) * 100)
          : 0

        const { error } = await supabase
          .from('daily_tracking_stats')
          .upsert({
            user_id: user.id,
            date: targetDate,
            total_todos: totalTodos,
            completed_todos: completedTodos,
            completion_percentage: completionPercentage
          })

        if (error) {
          console.error('Error saving daily tracking stats:', error)
        }
      }
    } catch (error) {
      console.error('Error in database save:', error)
    }
  },

  // Get daily tracking stats for a specific date range
  async getDailyTrackingStats(startDate, endDate) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('daily_tracking_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching daily tracking stats:', error)
      return []
    }

    return data || []
  },

  // Get weekly analytics from database (for authenticated users)
  async getWeeklyAnalytics() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Return mock data for unauthenticated users
      return this.getMockWeeklyData()
    }

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    const startDate = sevenDaysAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    // Get stats from database
    const dbStats = await this.getDailyTrackingStats(startDate, endDate)

    // Fill in missing days with data from localStorage or zeros
    const weeklyData = []
    const currentDate = new Date(today)
    for (let i = 6; i >= 0; i--) {
      const dateString = currentDate.toISOString().split('T')[0]
      
      const existingData = dbStats.find(stat => stat.date === dateString)
      
      if (existingData) {
        weeklyData.push({
          date: dateString,
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          total_todos: existingData.total_todos,
          completed_todos: existingData.completed_todos,
          completion_percentage: existingData.completion_percentage
        })
      } else {
        // Try to get from localStorage
        const localData = this.getLocalStatsForDate(dateString)
        weeklyData.push({
          date: dateString,
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          total_todos: localData.total_todos,
          completed_todos: localData.completed_todos,
          completion_percentage: localData.completion_percentage
        })
      }
      
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return weeklyData.reverse()
  },

  getLocalStatsForDate(dateString) {
    const localStats = JSON.parse(localStorage.getItem('dailyStats') || '[]')
    
    // Find stats for the specific date
    const existingData = localStats.find(stat => stat.date === dateString)
    
    if (existingData) {
      return {
        total_todos: existingData.total_todos,
        completed_todos: existingData.completed_todos,
        completion_percentage: existingData.completion_percentage
      }
    }
    
    return { total_todos: 0, completed_todos: 0, completion_percentage: 0 }
  },

  getMockWeeklyData() {
    const weeklyData = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() - i)
      const dateString = currentDate.toISOString().split('T')[0]
      
      // Generate realistic mock data
      const totalTodos = Math.floor(Math.random() * 8) + 2 // 2-9 todos per day
      const completedTodos = Math.floor(totalTodos * (0.5 + Math.random() * 0.5)) // 50-100% completion
      const completionPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
      
      weeklyData.push({
        date: dateString,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        total_todos: totalTodos,
        completed_todos: completedTodos,
        completion_percentage: completionPercentage
      })
    }
    
    return weeklyData
  }
} 