export default function DarkContainer({ children, className = "", fullWidth = false, variant = "default" }) {
  if (variant === "auth") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className={`max-w-md mx-auto px-6 py-16 ${className}`}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className={`${
        fullWidth 
          ? 'w-full px-4 py-6 flex-1 flex flex-col' 
          : 'max-w-md w-full px-6 py-8 mx-auto flex items-center justify-center flex-1'
      } ${className}`}>
        {children}
      </div>
    </div>
  )
} 