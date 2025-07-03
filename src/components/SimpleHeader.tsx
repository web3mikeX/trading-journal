"use client"

import { useAuth } from "@/hooks/useAuth"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  HomeIcon, 
  BarChart3Icon, 
  BookOpenIcon, 
  TrendingUpIcon, 
  SettingsIcon,
  LogOutIcon
} from "lucide-react"

export default function SimpleHeader() {
  const { user } = useAuth()
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Trades", href: "/trades", icon: BarChart3Icon },
    { name: "Analytics", href: "/analytics", icon: TrendingUpIcon },
    { name: "Journal", href: "/journal", icon: BookOpenIcon },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TradingJournal</span>
            </Link>
            
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
              <span className="text-sm text-gray-300">
                {user?.name || user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}