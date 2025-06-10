import { useMemo } from 'react'

export function useProgressTracking(todos) {
  const progress = useMemo(() => {
    if (!todos || !Array.isArray(todos)) {
      return { completed: 0, total: 0 }
    }
    
    const completed = todos.filter(todo => todo.completed).length
    const total = todos.length
    
    return { completed, total }
  }, [todos])

  return progress
}
