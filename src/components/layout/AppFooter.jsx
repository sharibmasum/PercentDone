import { memo } from 'react'
import ProgressBar from '../ui/ProgressBar'
import AuthActions from '../auth/AuthActions'

const AppFooter = memo(({ 
  variant = 'desktop', 
  progress,
  user,
  onSignOut,
  onSignIn,
  onAnalytics,
  isToday = false,
  style
}) => {
  const isMobile = variant === 'mobile'
  
  return (
    <div 
      className={`bg-gray-900 ${isMobile ? 'absolute bottom-0 left-0 right-0' : ''}`}
      style={style}
    >
      <div className="px-6 py-3">
        <ProgressBar 
          progress={progress} 
          size={isMobile ? undefined : 'md'} 
          isToday={isToday}
        />
      </div>

      <div className="px-6 py-6">
        {isMobile ? (
          <>
            <AuthActions
              user={user}
              onSignOut={onSignOut}
              onSignIn={onSignIn}
              onAnalytics={onAnalytics}
              variant="mobile"
            />
            
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                📝 PercentDone by Sharib Masum
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-[120px]">
              <div className="text-left">
                <p className="text-xs text-gray-500">
                  📝 PercentDone
                </p>
                <p className="text-xs text-gray-400">
                  by Sharib Masum
                </p>
              </div>
            </div>

            <AuthActions
              user={user}
              onSignOut={onSignOut}
              onSignIn={onSignIn}
              onAnalytics={onAnalytics}
              variant="desktop"
            />
          </div>
        )}
      </div>
    </div>
  )
})

AppFooter.displayName = 'AppFooter'

export default AppFooter 