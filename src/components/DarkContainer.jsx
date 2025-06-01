export default function DarkContainer({ children, className = "" }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className={`max-w-md w-full px-6 py-8 ${className}`}>
        {children}
      </div>
    </div>
  )
} 