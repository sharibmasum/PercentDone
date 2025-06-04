import { memo } from 'react'

const DayCardContainer = memo(({ 
  children, 
  isFocused = false, 
  onClick, 
  variant = 'desktop' 
}) => {
  const scaleClass = variant === 'desktop' ? 'scale-[1.01]' : 'scale-[1.005]'
  
  return (
    <div 
      className={`flex-1 cursor-pointer transition-all duration-100 min-h-0 ${
        isFocused
          ? `ring-4 ring-blue-400 shadow-lg shadow-blue-400/25 rounded-xl ${scaleClass}` 
          : 'hover:ring-2 hover:ring-gray-500/50 hover:rounded-xl'
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  )
})

DayCardContainer.displayName = 'DayCardContainer'

export default DayCardContainer 