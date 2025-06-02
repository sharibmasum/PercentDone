import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import DarkContainer from '../components/DarkContainer'
import DayCard from '../components/DayCard'
import DarkButton from '../components/DarkButton'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [mobileIndex, setMobileIndex] = useState(0) // For mobile navigation

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
    <DarkContainer fullWidth>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-white">
            📝 PercentDone
          </h1>
          
          {/* Mobile Navigation - only visible on mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={handleMobilePrev}
              disabled={mobileIndex === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              Day {mobileIndex + 1}
            </span>
            
            <button
              onClick={handleMobileNext}
              disabled={mobileIndex === mobileDates.length - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Day Layout */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Single day with navigation */}
        <div className="block md:hidden">
          <DayCard 
            key={mobileDates[mobileIndex].toISOString()}
            date={mobileDates[mobileIndex]} 
            isToday={mobileIndex === 0}
          />
        </div>

        {/* Tablet: 3 days side by side */}
        <div className="hidden md:flex lg:hidden gap-4 pb-4">
          {tabletDates.map((date, index) => (
            <DayCard 
              key={date.toISOString()}
              date={date} 
              isToday={index === 0}
            />
          ))}
        </div>

        {/* Desktop: Fixed 5 days */}
        <div className="hidden lg:flex gap-6 pb-4">
          {desktopDates.map((date, index) => (
            <DayCard 
              key={date.toISOString()}
              date={date} 
              isToday={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Bottom Actions - Compact Layout */}
      <div className="mt-4 pt-4 border-t border-gray-800">
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
  )
} 