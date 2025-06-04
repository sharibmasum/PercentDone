import { memo } from 'react'

export default memo(function MobileNavigation({ 
  currentIndex, 
  onPrev, 
  onNext, 
  canGoPrev, 
  canGoNext 
}) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors duration-200"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      <span className="text-xs text-gray-400 min-w-[50px] text-center">
        Day {currentIndex + 1}
      </span>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors duration-200"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}) 