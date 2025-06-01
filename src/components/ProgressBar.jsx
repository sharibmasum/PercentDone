import React from 'react'

export default function ProgressBar({ completed, total, showPercentage = true }) {
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="mb-4">
      <div className="mt-2 relative pt-1">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
          />
        </div>
        {showPercentage && (
          <p className="mt-2 text-sm text-gray-600">
            {completed} of {total} tasks completed ({Math.round(progress)}%)
          </p>
        )}
      </div>
    </div>
  )
} 