import { createClient } from '@supabase/supabase-js'

const emitProgressUpdate = (date) => {
  const event = new CustomEvent('todoUpdated', { detail: { date } })
  window.dispatchEvent(event)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const getUTCDateString = (date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  return utcDate.toISOString().split('T')[0]
}

export const todoOperations = {
  async getTodosToday() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const today = getUTCDateString(new Date())
    
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

    const allTodosForDate = await this.getTodosByDate(dateString)
    localStorage.setItem(`todos_${dateString}`, JSON.stringify(allTodosForDate))
    
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

    const todoDate = data.todo_date
    const allTodosForDate = await this.getTodosByDate(todoDate)
    localStorage.setItem(`todos_${todoDate}`, JSON.stringify(allTodosForDate))
    
    emitProgressUpdate(new Date(todoDate))
    
    return data
  },

  async deleteTodo(id) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

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

    const todoDate = todoToDelete.todo_date
    const allTodosForDate = await this.getTodosByDate(todoDate)
    localStorage.setItem(`todos_${todoDate}`, JSON.stringify(allTodosForDate))
    
    emitProgressUpdate(new Date(todoDate))

    return true
  },

  async toggleTodo(id, completed) {
    const result = await this.updateTodo(id, { completed })
    return result
  },

  async clearPreviousDaysTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    const today = getUTCDateString(new Date())
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('user_id', user.id)
      .lt('todo_date', today)

    if (error) {
      console.error('Error clearing previous days todos from database:', error)
    }

    const allDates = this.getAllStoredDates()
    for (const dateString of allDates) {
      if (dateString < today) {
        localStorage.removeItem(`todos_${dateString}`)
      }
    }

    emitProgressUpdate(new Date())
  },

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

  async saveToDailyTracker(dateString, data) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return
      }

      const { error } = await supabase
        .from('daily_tracker')
        .upsert({
          user_id: user.id,
          date: dateString,
          total_todos: data.total_todos,
          completed_todos: data.completed_todos,
          completion_percentage: data.completion_percentage
        }, {
          onConflict: 'user_id,date'
        })

      if (error) {
        console.error('Error saving to daily_tracker:', error)
      }
    } catch (error) {
      console.error('Error in saveToDailyTracker:', error)
    }
  },

  async getDailyTrackingStats(startDate, endDate) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('daily_tracker')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching from daily_tracker:', error)
      return []
    }

    return data || []
  },

  async getWeeklyAnalytics() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const todayDate = new Date()
    const today = getUTCDateString(todayDate)
    const sevenDaysAgo = new Date(todayDate)
    sevenDaysAgo.setDate(todayDate.getDate() - 6)

    const startDate = getUTCDateString(sevenDaysAgo)
    const endDate = today

    const dbStats = await this.getDailyTrackingStats(startDate, endDate)

    const weeklyData = []
    const currentDate = new Date(todayDate)
    
    for (let i = 6; i >= 0; i--) {
      const dateString = getUTCDateString(currentDate)
      
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
        weeklyData.push({
          date: dateString,
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          total_todos: 0,
          completed_todos: 0,
          completion_percentage: 0
        })
      }
      
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return weeklyData.reverse()
  },
} 