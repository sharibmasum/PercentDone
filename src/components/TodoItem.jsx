import { useState, useEffect } from 'react'

export default function TodoItem({ todo, onToggle, onDelete, onEdit, showLocalTag = false }) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.task)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false)
    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
    setEditText(todo.task)
  }

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== todo.task) {
      onEdit(todo.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(todo.task)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="relative group">
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between
                    hover:bg-gray-750 transition-colors duration-200">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            {todo.completed ? (
              <div 
                className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center cursor-pointer"
                onClick={() => onToggle(todo.id, todo.completed)}
              >
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div 
                className="w-5 h-5 rounded-full border-2 border-gray-600 cursor-pointer
                         hover:border-gray-500 transition-colors duration-200"
                onClick={() => onToggle(todo.id, todo.completed)}
              />
            )}
          </div>
          
          {isEditing ? (
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveEdit}
                className="flex-1 bg-gray-700 text-white px-3 py-1 rounded border border-gray-600
                         focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-green-400 hover:text-green-300 p-1"
                title="Save"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-red-400 hover:text-red-300 p-1"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <span className={`flex-1 ${
              todo.completed 
                ? 'line-through text-gray-500' 
                : 'text-white'
            }`}>
              {todo.task}
              {showLocalTag && todo.local && (
                <span className="ml-2 text-xs text-yellow-400">(local)</span>
              )}
            </span>
          )}
        </div>
        
        {/* Three dots menu */}
        {!isEditing && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100
                       transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-gray-700 rounded-lg shadow-lg
                            border border-gray-600 py-1 z-10">
                <button
                  onClick={() => {
                    handleEdit()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600
                           transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(todo.id)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600
                           transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 