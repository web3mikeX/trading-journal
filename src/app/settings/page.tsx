"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { 
  UserIcon, 
  BellIcon, 
  ShieldIcon, 
  PaletteIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon
} from "lucide-react"
import Header from "@/components/Header"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

export default function Settings() {
  // FIXED: Using useAuth instead of useSession
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { user } = useAuth()
  const [showApiKey, setShowApiKey] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: true,
    displayCurrency: "USD",
    timezone: "UTC",
    apiKey: "sk-1234567890abcdef..."
  })

  const handleSave = () => {
    console.log("Saving settings:", settings)
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>Settings</h1>
          
          <div className="space-y-6">
            {/* Profile Section */}
            <div className={`${themeClasses.surface} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <UserIcon className={`w-5 h-5 ${themeClasses.accent}`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Profile</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Name</label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    className={`${themeClasses.input}`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    className={`${themeClasses.input}`}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className={`${themeClasses.surface} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <PaletteIcon className={`w-5 h-5 ${themeClasses.accent}`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Preferences</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`${themeClasses.text} font-medium`}>Dark Mode</h3>
                    <p className={`${themeClasses.textMuted} text-sm`}>Use dark theme</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`${themeClasses.text} font-medium`}>Auto Save</h3>
                    <p className={`${themeClasses.textMuted} text-sm`}>Automatically save changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Display Currency</label>
                    <select
                      value={settings.displayCurrency}
                      onChange={(e) => setSettings({...settings, displayCurrency: e.target.value})}
                      className={`${themeClasses.input} [&>option]:bg-slate-800 [&>option]:text-white`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className={`${themeClasses.input} [&>option]:bg-slate-800 [&>option]:text-white`}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="PST">PST</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className={`${themeClasses.surface} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <BellIcon className={`w-5 h-5 ${themeClasses.accent}`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Notifications</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`${themeClasses.text} font-medium`}>Push Notifications</h3>
                  <p className={`${themeClasses.textMuted} text-sm`}>Receive trade alerts and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className={`${themeClasses.surface} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <ShieldIcon className={`w-5 h-5 ${themeClasses.accent}`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Security</h2>
              </div>
              
              <div>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>API Key</label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    className={`flex-1 ${themeClasses.input}`}
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className={`p-2 ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}
                  >
                    {showApiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}