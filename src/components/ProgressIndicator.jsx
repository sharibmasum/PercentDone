export default function ProgressIndicator({ completed, total }) {
  const completionPercentage = total > 0 ? (completed / total) * 100 : 0

  if (total === 0) return null

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Progress</span>
        <span className="text-sm text-gray-400">
          {completed}/{total} ({Math.round(completionPercentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  )
} 