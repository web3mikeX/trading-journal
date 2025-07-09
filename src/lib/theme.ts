export function getThemeClasses(theme: "dark" | "light") {
  if (theme === "light") {
    return {
      // Clean White Light Mode - minimal and professional
      background: "bg-white",
      surface: "bg-white border border-gray-200 shadow-sm",
      text: "text-gray-900",
      textSecondary: "text-gray-600", 
      textMuted: "text-gray-500",
      accent: "text-blue-600",
      border: "border-gray-200",
      button: "bg-gray-100 hover:bg-gray-200 text-gray-900",
      select: "[&>option]:bg-white [&>option]:text-gray-900",
      input: "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500",
    }
  }
  
  // Predominantly Black Dark Mode - clean and minimal
  return {
    background: "bg-black",
    surface: "bg-gray-900/80 border border-gray-800/50 shadow-lg",
    text: "text-white",
    textSecondary: "text-gray-300",
    textMuted: "text-gray-400",
    accent: "text-blue-400",
    border: "border-gray-800/50",
    button: "bg-gray-800/60 hover:bg-gray-700/60 text-white",
    select: "[&>option]:bg-gray-900 [&>option]:text-white",
    input: "bg-gray-900/60 border border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-400",
  }
}