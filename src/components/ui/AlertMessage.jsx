export default function AlertMessage({ children, type = "error", className = "" }) {
  const typeClasses = {
    error: "bg-red-900/20 border-red-700/30 text-red-200",
    warning: "bg-yellow-900/20 border-yellow-700/30 text-yellow-200",
    info: "bg-blue-900/20 border-blue-700/30 text-blue-200",
    success: "bg-green-900/20 border-green-700/30 text-green-200"
  }

  return (
    <div className={`border rounded-lg p-3 text-sm mb-6 ${typeClasses[type]} ${className}`}>
      {children}
    </div>
  )
} 