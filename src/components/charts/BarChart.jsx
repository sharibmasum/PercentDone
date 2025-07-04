import React from 'react'

export default function BarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400">No data available</p>
      </div>
    )
  }

  const maxPercentage = 100
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-center text-white">Weekly Completion Percentage</h3>
      
      <div className="pt-8 pb-4">
        <div className="flex items-end justify-between h-64 mb-4 bg-gray-900 rounded p-2">
          {data.map((day) => {
            const height = Math.max((day.completion_percentage / maxPercentage) * 100, 2)
            const isToday = day.date === new Date().toISOString().split('T')[0]
            
            return (
              <div key={day.date} className="flex flex-col items-center flex-1 h-full">
                <div className="relative w-full max-w-12 h-full flex flex-col justify-end">
                  {day.completion_percentage > 0 && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-300 whitespace-nowrap z-10">
                      {Math.round(day.completion_percentage)}%
                    </div>
                  )}
                  
                  <div
                    className={`w-full rounded-t transition-all duration-300 shadow-sm ${
                      isToday 
                        ? 'bg-blue-500 border-2 border-blue-400' 
                        : day.completion_percentage === 100 
                          ? 'bg-green-500 border-2 border-green-400' 
                          : day.completion_percentage > 0 
                            ? 'bg-yellow-500 border-2 border-yellow-400' 
                            : 'bg-gray-600 border-2 border-gray-500'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
                
                <div className="mt-3 text-center">
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
                    {day.dayName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(day.date).getDate()}
                  </div>
                  {day.total_todos > 0 && (
                    <div className="text-xs text-gray-400">
                      {day.completed_todos}/{day.total_todos}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span className="text-gray-300">100%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span className="text-gray-300">Partial</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-600 rounded mr-1"></div>
          <span className="text-gray-300">0%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span className="text-gray-300">Today</span>
        </div>
      </div>
    </div>
  )
} 