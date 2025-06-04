import { memo } from 'react'

const DayCardSkeleton = memo(() => (
  <div className="flex-1">
    <div className="bg-gray-900 rounded-xl p-6 h-full flex flex-col animate-pulse">
      <div className="text-center mb-6">
        <div className="h-8 bg-gray-800 rounded mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-32 mx-auto"></div>
      </div>
      <div className="h-12 bg-gray-800 rounded mb-6"></div>
      <div className="flex-1">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
))

DayCardSkeleton.displayName = 'DayCardSkeleton'

export default DayCardSkeleton 