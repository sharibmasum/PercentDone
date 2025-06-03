import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import DarkContainer from '../components/DarkContainer'
import DayCard from '../components/DayCard'
import DarkButton from '../components/DarkButton'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [mobileIndex, setMobileIndex] = useState(0) // For mobile navigation

  // Add/remove mobile class for scroll prevention
  useEffect(() => {
    // Add class on mount (mobile scroll prevention)
    document.body.classList.add('dashboard-mobile')
    
    // Remove class on unmount (restore normal scrolling)
    return () => {
      document.body.classList.remove('dashboard-mobile')
    }
  }, [])

  // Generate array of dates starting from today
  const generateDates = (count) => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  // Get dates based on screen size - fixed responsive breakpoints
  const desktopDates = generateDates(5) // Fixed 5 days on desktop
  const tabletDates = generateDates(3)  // Fixed 3 days on tablet
  const mobileDates = generateDates(14) // Have 14 days available for mobile navigation

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleMobilePrev = () => {
    setMobileIndex(prev => Math.max(0, prev - 1))
  }

  const handleMobileNext = () => {
    setMobileIndex(prev => Math.min(mobileDates.length - 1, prev + 1))
  }

  return (
    <>
      {/* Mobile Layout: Natural flow for iOS Safari */}
      <div 
        className="block md:hidden bg-gray-900 h-[100dvh] flex flex-col overflow-hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          touchAction: 'none',
          overscrollBehavior: 'none',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header - Fixed at top */}
        <div className="bg-gray-900 px-3 py-2 flex-shrink-0 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-light text-white">
              📝 PercentDone
            </h1>
            
            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMobilePrev}
                disabled={mobileIndex === 0}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <span className="text-xs text-gray-400 min-w-[50px] text-center">
                Day {mobileIndex + 1}
              </span>
              
              <button
                onClick={handleMobileNext}
                disabled={mobileIndex === mobileDates.length - 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Day card - Strictly constrained middle area */}
        <div 
          className="flex-1 px-3 overflow-hidden" 
          style={{ 
            maxHeight: 'calc(100dvh - 130px)',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          <DayCard 
            key={mobileDates[mobileIndex].toISOString()}
            date={mobileDates[mobileIndex]} 
            isToday={mobileIndex === 0}
          />
        </div>

        {/* Bottom Actions - Fixed at bottom with negative margin to overlap safe area */}
        <div 
          className="border-t border-gray-700 px-3 pt-2 flex-shrink-0" 
          style={{ 
            marginBottom: 'calc(-1 * env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <DarkButton
              onClick={() => navigate('/analytics')}
              variant="secondary"
              className="!py-2 text-xs flex-1 max-w-[130px]"
            >
              📊 Analytics
            </DarkButton>
            
            {user ? (
              <DarkButton
                onClick={handleSignOut}
                variant="outline"
                className="!py-2 text-xs flex-1 max-w-[130px]"
              >
                Sign Out
              </DarkButton>
            ) : (
              <DarkButton
                onClick={() => navigate('/login')}
                variant="primary"
                className="!py-2 text-xs flex-1 max-w-[130px]"
              >
                Sign In to Save
              </DarkButton>
            )}
          </div>
          
          {/* Brand info */}
          <div className="text-center" style={{ paddingBottom: '0px', marginBottom: '0px' }}>
            <p className="text-xs text-gray-500" style={{ marginBottom: '0px' }}>
              📝 PercentDone by Sharib Masum
            </p>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout: Fixed bottom elements */}
      <div className="hidden md:block h-screen max-h-screen overflow-hidden bg-gray-900">
        <DarkContainer fullWidth className="!py-6 !px-4 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-light text-white">
                📝 PercentDone
              </h1>
            </div>
          </div>

          {/* Multi-Day Layout */}
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Tablet: 3 days side by side */}
            <div className="flex lg:hidden gap-4 pb-4 h-full">
              {tabletDates.map((date, index) => (
                <DayCard 
                  key={date.toISOString()}
                  date={date} 
                  isToday={index === 0}
                />
              ))}
            </div>

            {/* Desktop: Fixed 5 days */}
            <div className="hidden lg:flex gap-6 pb-4 h-full">
              {desktopDates.map((date, index) => (
                <DayCard 
                  key={date.toISOString()}
                  date={date} 
                  isToday={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Bottom Actions - Locked at bottom */}
          <div className="mt-4 pt-4 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Far Left - Brand Info */}
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

              {/* Right - Analytics + Auth Actions */}
              <div className="flex items-center space-x-4">
                {/* Analytics Button */}
                <DarkButton
                  onClick={() => navigate('/analytics')}
                  variant="secondary"
                  className="text-sm whitespace-nowrap"
                >
                  📊 Analytics
                </DarkButton>

                {/* Auth Actions */}
                {user ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">
                      {user.email}
                    </p>
                    <DarkButton
                      onClick={handleSignOut}
                      variant="outline"
                      className="text-sm"
                    >
                      Sign Out
                    </DarkButton>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <DarkButton
                      onClick={() => navigate('/login')}
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
            </div>
          </div>
        </DarkContainer>
      </div>
    </>
  )
} 