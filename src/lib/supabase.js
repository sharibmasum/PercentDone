import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Check if tables exist
    const { error: tablesError } = await supabase.rpc('create_tables')
    if (tablesError) {
      console.error('Error creating tables:', tablesError)
      throw tablesError
    }
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Todo operations
export const todoOperations = {
  // Initialize database before any operations
  async initialize() {
    try {
      await initializeDatabase()
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  },

  // Get todos for the current day
  async getTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user authenticated, returning empty array')
      return [] // Return empty array for non-authenticated users
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('todo_date', today)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Add a new todo
  async addTodo(task) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      throw new Error('Failed to get user information')
    }
    
    if (!user) {
      throw new Error('Must be logged in to add todos to database')
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    console.log('Adding todo for user:', user.id, 'task:', task, 'date:', today)
    
    const todoData = {
      task: task.trim(),
      user_id: user.id,
      completed: false,
      todo_date: today
    }
    
    const { data, error } = await supabase
      .from('todos')
      .insert([todoData])
      .select('*')
      .single()
    
    if (error) {
      console.error('Error inserting todo:', error)
      console.error('Todo data attempted:', todoData)
      throw error
    }
    
    console.log('Successfully inserted todo:', data)
    return data
  },

  // Update a todo
  async updateTodo(id, updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user authenticated, skipping database update')
      return null // Return null instead of throwing error
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a todo
  async deleteTodo(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user authenticated, skipping database delete')
      return // Return early instead of throwing error
    }
    
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  // Toggle todo completion status
  async toggleTodo(id, completed) {
    return this.updateTodo(id, { completed })
  },

  // Save daily completion stats
  async saveDailyStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Skip for non-authenticated users

    const today = new Date().toISOString().split('T')[0]

    // Get today's todos
    const { data: todos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('todo_date', today)

    if (fetchError) throw fetchError

    const totalTodos = todos.length
    const completedTodos = todos.filter(todo => todo.completed).length
    const completionPercentage = totalTodos > 0 
      ? (completedTodos / totalTodos) * 100 
      : 0

    console.log('Saving daily stats:', {
      user_id: user.id,
      date: today,
      total_todos: totalTodos,
      completed_todos: completedTodos,
      completion_percentage: completionPercentage
    })

    // Check if record already exists for this user and date
    const { data: existingRecord, error: checkError } = await supabase
      .from('daily_tracker')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing record:', checkError)
      throw checkError
    }

    const statsData = {
      user_id: user.id,
      date: today,
      total_todos: totalTodos,
      completed_todos: completedTodos,
      completion_percentage: completionPercentage
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('daily_tracker')
        .update({
          total_todos: totalTodos,
          completed_todos: completedTodos,
          completion_percentage: completionPercentage
        })
        .eq('user_id', user.id)
        .eq('date', today)

      if (updateError) {
        console.error('Error updating daily stats:', updateError)
        throw updateError
      }
      console.log('Daily stats updated successfully')
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('daily_tracker')
        .insert([statsData])

      if (insertError) {
        console.error('Error inserting daily stats:', insertError)
        throw insertError
      }
      console.log('Daily stats inserted successfully')
    }
  },

  // Get weekly analytics data (past 7 days)
  async getWeeklyAnalytics() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Calculate date range for past 7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6) // Include today + 6 previous days = 7 days total

    const startDate = sevenDaysAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    console.log('Fetching analytics from', startDate, 'to', endDate)

    const { data, error } = await supabase
      .from('daily_tracker')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching weekly analytics:', error)
      throw error
    }

    // Fill in missing days with 0% completion
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() - i)
      const dateString = currentDate.toISOString().split('T')[0]
      
      const existingData = data.find(d => d.date === dateString)
      weeklyData.push({
        date: dateString,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        completion_percentage: existingData ? existingData.completion_percentage : 0,
        total_todos: existingData ? existingData.total_todos : 0,
        completed_todos: existingData ? existingData.completed_todos : 0
      })
    }

    console.log('Weekly analytics data:', weeklyData)
    return weeklyData
  }
} 