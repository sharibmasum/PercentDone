import { useEffect, useMemo, memo, useCallback, lazy, Suspense, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useDateGeneration } from '../hooks/useDateGeneration'
import { useMobileNavigation } from '../hooks/useMobileNavigation'
import { todoOperations } from '../lib/supabase'
import DayCardSkeleton from '../components/ui/DayCardSkeleton'
import DayCardContainer from '../components/todo/DayCardContainer'
import AppHeader from '../components/layout/AppHeader'
import AppFooter from '../components/layout/AppFooter'
import AuthActions from '../components/auth/AuthActions'
import ProgressBar from '../components/ui/ProgressBar'

const DayCard = lazy(() => import('../components/todo/DayCard'))

function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const dates = useDateGeneration()
  const {
    mobileIndex,
    handlePrev,
    handleNext,
    canGoPrev,
    canGoNext
  } = useMobileNavigation(dates.mobile.length)

  const focusedDayRef = useRef(0)
  
  const [todayProgress, setTodayProgress] = useState({ completed: 0, total: 0 })
  const [mobileProgress, setMobileProgress] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    document.body.classList.add('dashboard-mobile')
    return () => document.body.classList.remove('dashboard-mobile')
  }, [])

  useEffect(() => {
    const clearPreviousDays = async () => {
      try {
        await todoOperations.clearPreviousDaysTodos()
      } catch (error) {
        console.error('Error clearing previous days:', error)
      }
    }
    clearPreviousDays()
  }, [])
    
  const handleProgressUpdate = useCallback((progress, isToday, isMobile) => {
    if (isToday && isMobile) {
      setMobileProgress(progress)
    } else if (isToday) {
      setTodayProgress(progress)
    }
  }, [])

  const dateStrings = useMemo(() => {
    const getUTCDateString = (date) => {
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      return utcDate.toISOString().split('T')[0]
    }
    
    return {
      today: getUTCDateString(new Date()),
      mobileKey: dates.mobile[mobileIndex] ? getUTCDateString(dates.mobile[mobileIndex]) : null,
      tabletKeys: dates.tablet.map(date => getUTCDateString(date)),
      desktopKeys: dates.desktop.map(date => getUTCDateString(date))
    }
  }, [dates.mobile, dates.tablet, dates.desktop, mobileIndex])

  const mobileStyles = useMemo(() => ({
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      touchAction: 'pan-y',
      overscrollBehavior: 'contain'
    },
    content: { 
      touchAction: 'pan-y',
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch'
    }
  }), [])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }, [signOut, navigate])

  const handleSignIn = useCallback(() => navigate('/login'), [navigate])
  const handleAnalytics = useCallback(() => navigate('/analytics'), [navigate])

  const handleDayFocus = useCallback((dayIndex) => {
    if (focusedDayRef.current !== dayIndex) {
      focusedDayRef.current = dayIndex
    }
  }, [])

  useEffect(() => {
    if (focusedDayRef.current !== mobileIndex) {
      focusedDayRef.current = mobileIndex
    }
  }, [mobileIndex])

  const MemoizedDayCard = useMemo(() => {
    return memo((props) => (
      <Suspense fallback={<DayCardSkeleton />}>
        <DayCard 
          {...props}
          isFocused={true}
          onProgressUpdate={handleProgressUpdate}
        />
      </Suspense>
    ))
  }, [handleProgressUpdate])

  return (
    <>
      <div 
        className="block md:hidden bg-gray-900 h-[100dvh] relative"
        style={mobileStyles.container}
      >
        <div className="bg-gray-900 border-b border-gray-800 px-3 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-light text-white">
              📝 PercentDone
            </h1>
            <AuthActions
              user={user}
              onSignOut={handleSignOut}
              onSignIn={handleSignIn}
              onAnalytics={handleAnalytics}
              variant="mobile"
            />
          </div>
        </div>

        <div 
          className="px-2 mt-2 overflow-y-auto custom-scrollbar"
          style={{ 
            ...mobileStyles.content,
            paddingBottom: '100px',
            height: 'calc(100dvh - 48px)'
          }}
        >
          <MemoizedDayCard
            key={dateStrings.mobileKey}
            date={dates.mobile[mobileIndex]}
            isToday={mobileIndex === 0}
            isMobile={true}
            mobileIndex={mobileIndex}
            handlePrev={handlePrev}
            handleNext={handleNext}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
          />
        </div>

        <div 
          className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2"
          style={{ 
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' 
          }}
        >
          <ProgressBar progress={mobileProgress} isToday={mobileIndex === 0} />
        </div>
      </div>

      <div 
        className="hidden md:grid bg-gray-900 h-[100vh] overflow-hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          gridTemplateRows: 'auto 1fr auto'
        }}
      >
        <AppHeader 
          variant="desktop" 
          subtitle="💡 Click on any day to highlight it"
        />

        <div className="px-6 py-4 overflow-hidden min-h-0">
          <div className="flex lg:hidden gap-4 h-full">
            {dates.tablet.map((date, index) => {
              const isFocused = focusedDayRef.current === index
              
              return (
                <DayCardContainer
                  key={dateStrings.tabletKeys[index]}
                  isFocused={isFocused}
                  onClick={() => handleDayFocus(index)}
                  variant="tablet"
                >
                  <MemoizedDayCard
                    date={date}
                    isToday={index === 0}
                    isMobile={false}
                  />
                </DayCardContainer>
              )
            })}
          </div>

          <div className="hidden lg:flex gap-6 h-full">
            {dates.desktop.map((date, index) => {
              const isFocused = focusedDayRef.current === index
              
              return (
                <DayCardContainer
                  key={dateStrings.desktopKeys[index]}
                  isFocused={isFocused}
                  onClick={() => handleDayFocus(index)}
                  variant="desktop"
                >
                  <MemoizedDayCard
                    date={date}
                    isToday={index === 0}
                    isMobile={false}
                  />
                </DayCardContainer>
              )
            })}
          </div>
        </div>

        <AppFooter
          variant="desktop"
          progress={todayProgress}
          user={user}
          onSignOut={handleSignOut}
          onSignIn={handleSignIn}
          onAnalytics={handleAnalytics}
          isToday={true}
        />
      </div>
    </>
  )
}

export default memo(Dashboard)  