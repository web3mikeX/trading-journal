export function getThemeClasses(theme: "dark" | "light") {
  if (theme === "light") {
    return {
      // Soft Corporate Light Mode - professional and easy on the eyes
      background: "bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50",
      surface: "bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-sm",
      text: "text-gray-900",
      textSecondary: "text-gray-600", 
      textMuted: "text-gray-500",
      accent: "text-blue-600",
      select: "[&>option]:bg-white [&>option]:text-gray-900",
      input: "bg-white/70 border border-gray-200/60 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-400",
    }
  }
  
  // Dark mode (default) - keep current beautiful styling
  return {
    background: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    surface: "bg-white/10 backdrop-blur-xl border border-white/20",
    text: "text-white",
    textSecondary: "text-gray-300",
    textMuted: "text-gray-400",
    accent: "text-blue-400",
    select: "[&>option]:bg-slate-800 [&>option]:text-white",
    input: "bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500",
  }
}