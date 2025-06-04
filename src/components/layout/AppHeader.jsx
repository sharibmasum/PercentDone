import { memo } from 'react'

const AppHeader = memo(({ 
  variant = 'desktop', 
  subtitle,
  children 
}) => {
  const baseClasses = "border-b border-gray-800"
  const desktopClasses = "px-6 py-6"
  const mobileClasses = "px-3 py-2 flex-shrink-0"
  
  const titleSize = variant === 'mobile' ? 'text-lg' : 'text-2xl'
  const containerClasses = variant === 'mobile' ? mobileClasses : desktopClasses

  return (
    <div className={`bg-gray-900 ${baseClasses} ${containerClasses}`}>
      <div className="flex items-center justify-between">
        <h1 className={`${titleSize} font-light text-white`}>
          📝 PercentDone
        </h1>
        
        {subtitle && (
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
})

AppHeader.displayName = 'AppHeader'

export default AppHeader 