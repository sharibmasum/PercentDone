export default function DarkButton({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  className = "", 
  disabled = false,
  ...props 
}) {
  const baseClasses = "w-full py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    outline: "bg-transparent hover:bg-gray-800 text-gray-400 border border-gray-700"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
} 