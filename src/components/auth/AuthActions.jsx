import { memo } from 'react'
import DarkButton from '../ui/DarkButton'

function AuthActions({ 
  user, 
  onSignOut, 
  onSignIn, 
  onAnalytics,
  variant = "desktop"
}) {
  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-2">
        <DarkButton
          onClick={onAnalytics}
          variant="secondary"
          className="!py-1.5 !px-3 text-sm !w-auto whitespace-nowrap"
        >
          📊
        </DarkButton>
        
        {user ? (
          <DarkButton
            onClick={onSignOut}
            variant="outline"
            className="!py-1.5 !px-3 text-sm !w-auto whitespace-nowrap"
          >
            Sign Out
          </DarkButton>
        ) : (
          <DarkButton
            onClick={onSignIn}
            variant="primary"
            className="!py-1.5 !px-3 text-sm !w-auto whitespace-nowrap"
          >
            Sign In
          </DarkButton>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <DarkButton
        onClick={onAnalytics}
        variant="secondary"
        className="text-sm whitespace-nowrap"
      >
        📊 Analytics
      </DarkButton>

      {user ? (
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">
            {user.email}
          </p>
          <DarkButton
            onClick={onSignOut}
            variant="outline"
            className="text-sm"
          >
            Sign Out
          </DarkButton>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <DarkButton
            onClick={onSignIn}
            variant="primary"
            className="text-sm whitespace-nowrap"
          >
            Sign In
          </DarkButton>
          <p className="text-xs text-yellow-400 md:whitespace-nowrap md:min-w-[180px] max-w-[120px] sm:max-w-none">
            ⚠️ Sign in to save permanently
          </p>
        </div>
      )}
    </div>
  )
}

export default memo(AuthActions) 