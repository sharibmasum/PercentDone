import { memo } from 'react'

export default memo(function TodoInput({ value, onChange, onSubmit, disabled = false, placeholder = "Add a task..." }) {
  return (
    <div className="mb-6">
      <form onSubmit={onSubmit} noValidate>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          </div>
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg py-4 pl-10 pr-4 
                     border border-gray-700 focus:border-gray-600 focus:outline-none focus:ring-0
                     transition-colors duration-200"
            disabled={disabled}
          />
        </div>
      </form>
    </div>
  )
}) 