export default function DarkInput({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  className = "", 
  disabled = false,
  ...props 
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg py-3 px-4 
                 border border-gray-700 focus:border-gray-600 focus:outline-none focus:ring-0
                 transition-colors duration-200 disabled:opacity-50 ${className}`}
      {...props}
    />
  )
} 