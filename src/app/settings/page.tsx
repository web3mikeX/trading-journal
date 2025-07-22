"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { 
  UserIcon, 
  BellIcon, 
  ShieldIcon, 
  PaletteIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon,
  CreditCardIcon,
  CalendarIcon
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: true,
    displayCurrency: "USD",
    timezone: "UTC",
    apiKey: "sk-1234567890abcdef...",
    // Account management settings
    accountBalance: "",
    dailyLossLimit: "",
    maxLossLimit: "",
    profitTarget: "",
    accountStartDate: "",
    brokerSyncEnabled: false,
    autoSyncEnabled: false,
    // Trailing drawdown settings
    accountType: "CUSTOM",
    startingBalance: "",
    trailingDrawdownAmount: "",
    isLiveFunded: false,
    firstPayoutReceived: false
  })

  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/settings?userId=${user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setSettings(prev => ({
            ...prev,
            displayCurrency: userData.baseCurrency || "USD",
            timezone: userData.timezone || "UTC",
            accountBalance: userData.accountBalance?.toString() || "",
            dailyLossLimit: userData.dailyLossLimit?.toString() || "",
            maxLossLimit: userData.maxLossLimit?.toString() || "",
            profitTarget: userData.profitTarget?.toString() || "",
            accountStartDate: userData.accountStartDate ? userData.accountStartDate.split('T')[0] : "",
            brokerSyncEnabled: userData.brokerSyncEnabled || false,
            autoSyncEnabled: userData.autoSyncEnabled || false,
            // Trailing drawdown settings
            accountType: userData.accountType || "CUSTOM",
            startingBalance: userData.startingBalance?.toString() || "",
            trailingDrawdownAmount: userData.trailingDrawdownAmount?.toString() || "",
            isLiveFunded: userData.isLiveFunded || false,
            firstPayoutReceived: userData.firstPayoutReceived || false
          }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/settings?userId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseCurrency: settings.displayCurrency,
          timezone: settings.timezone,
          accountBalance: settings.accountBalance,
          dailyLossLimit: settings.dailyLossLimit,
          maxLossLimit: settings.maxLossLimit,
          profitTarget: settings.profitTarget,
          accountStartDate: settings.accountStartDate,
          brokerSyncEnabled: settings.brokerSyncEnabled,
          autoSyncEnabled: settings.autoSyncEnabled,
          // Trailing drawdown settings
          accountType: settings.accountType,
          startingBalance: settings.startingBalance,
          trailingDrawdownAmount: settings.trailingDrawdownAmount,
          isLiveFunded: settings.isLiveFunded,
          firstPayoutReceived: settings.firstPayoutReceived
        })
      })

      if (response.ok) {
        console.log('Settings saved successfully')
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
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

            {/* Account Management Section */}
            <div className={`${themeClasses.surface} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <CreditCardIcon className={`w-5 h-5 ${themeClasses.accent}`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Account Management</h2>
              </div>
              
              <div className="space-y-4">
                {/* Account Type Selection */}
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-4`}>Account Type</label>
                  
                  {/* Evaluation Accounts Section */}
                  <div className="mb-6">
                    <h4 className={`text-sm font-medium ${themeClasses.text} mb-3 flex items-center`}>
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Evaluation Accounts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: "EVALUATION_50K", label: "Evaluation $50K", balance: "50,000", drawdown: "2,000", description: "Standard $50K evaluation" },
                        { value: "EVALUATION_100K", label: "Evaluation $100K", balance: "100,000", drawdown: "3,000", description: "Standard $100K evaluation" },
                        { value: "EVALUATION_150K", label: "Evaluation $150K", balance: "150,000", drawdown: "4,500", description: "Standard $150K evaluation" },
                        { value: "EVALUATION", label: "Evaluation Account", balance: "Variable", drawdown: "Variable", description: "Generic evaluation account" }
                      ].map((option) => (
                        <div
                          key={option.value}
                          className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                            settings.accountType === option.value
                              ? 'border-blue-500 bg-blue-500/10'
                              : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${themeClasses.surface}`
                          }`}
                          onClick={() => {
                            const newSettings = { ...settings, accountType: option.value }
                            if (option.value !== "EVALUATION") {
                              newSettings.startingBalance = option.balance.replace(',', '')
                              newSettings.trailingDrawdownAmount = option.drawdown.replace(',', '')
                            }
                            setSettings(newSettings)
                          }}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              name="accountType"
                              value={option.value}
                              checked={settings.accountType === option.value}
                              onChange={() => {}}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                            />
                            <div className="ml-3">
                              <label className={`text-sm font-medium ${themeClasses.text} cursor-pointer block`}>
                                {option.label}
                              </label>
                              <p className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                                {option.description}
                              </p>
                              <p className={`text-xs ${themeClasses.textMuted}`}>
                                Balance: ${option.balance} | Drawdown: ${option.drawdown}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Trading Section */}
                  <div className="mb-6">
                    <h4 className={`text-sm font-medium ${themeClasses.text} mb-3 flex items-center`}>
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Live Trading
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          settings.accountType === "LIVE_FUNDED"
                            ? 'border-green-500 bg-green-500/10'
                            : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${themeClasses.surface}`
                        }`}
                        onClick={() => {
                          setSettings({ ...settings, accountType: "LIVE_FUNDED" })
                        }}
                      >
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="accountType"
                            value="LIVE_FUNDED"
                            checked={settings.accountType === "LIVE_FUNDED"}
                            onChange={() => {}}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 mt-0.5"
                          />
                          <div className="ml-3">
                            <label className={`text-sm font-medium ${themeClasses.text} cursor-pointer block`}>
                              Live Funded Account
                            </label>
                            <p className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                              Post-evaluation funded trading account
                            </p>
                            <p className={`text-xs ${themeClasses.textMuted}`}>
                              Balance: Variable | MLL: $0 after first payout
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Configuration Section */}
                  <div className="mb-4">
                    <h4 className={`text-sm font-medium ${themeClasses.text} mb-3 flex items-center`}>
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Custom Configuration
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          settings.accountType === "CUSTOM"
                            ? 'border-orange-500 bg-orange-500/10'
                            : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${themeClasses.surface}`
                        }`}
                        onClick={() => {
                          setSettings({ ...settings, accountType: "CUSTOM" })
                        }}
                      >
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="accountType"
                            value="CUSTOM"
                            checked={settings.accountType === "CUSTOM"}
                            onChange={() => {}}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 mt-0.5"
                          />
                          <div className="ml-3">
                            <label className={`text-sm font-medium ${themeClasses.text} cursor-pointer block`}>
                              Custom Account
                            </label>
                            <p className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                              Fully manual setup for any broker or account type
                            </p>
                            <p className={`text-xs ${themeClasses.textMuted}`}>
                              Balance: Manual | Drawdown: Manual
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Starting Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50000.00"
                      value={settings.startingBalance}
                      onChange={(e) => setSettings({...settings, startingBalance: e.target.value})}
                      className={`${themeClasses.input}`}
                      disabled={settings.accountType !== "CUSTOM" && settings.accountType !== "EVALUATION"}
                    />
                    {(settings.accountType !== "CUSTOM" && settings.accountType !== "EVALUATION") && (
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                        Auto-filled based on account type
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Account Start Date</label>
                    <input
                      type="date"
                      value={settings.accountStartDate}
                      onChange={(e) => setSettings({...settings, accountStartDate: e.target.value})}
                      className={`${themeClasses.input}`}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Daily Loss Limit (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      value={settings.dailyLossLimit}
                      onChange={(e) => setSettings({...settings, dailyLossLimit: e.target.value})}
                      className={`${themeClasses.input}`}
                    />
                    <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
                      Maximum daily loss from account high (e.g., $1,000)
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Fixed Trailing Drawdown</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2000.00"
                      value={settings.trailingDrawdownAmount}
                      onChange={(e) => setSettings({...settings, trailingDrawdownAmount: e.target.value})}
                      className={`${themeClasses.input}`}
                      disabled={settings.accountType !== "CUSTOM" && settings.accountType !== "EVALUATION"}
                    />
                    {(settings.accountType !== "CUSTOM" && settings.accountType !== "EVALUATION") ? (
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                        Auto-filled based on account type
                      </p>
                    ) : (
                      <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
                        Fixed amount below account high (e.g., $2,000)
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Profit Target (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={settings.profitTarget}
                    onChange={(e) => setSettings({...settings, profitTarget: e.target.value})}
                    className={`${themeClasses.input}`}
                  />
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className={`${themeClasses.text} font-medium mb-4`}>Account Status</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`${themeClasses.text} font-medium`}>Live Funded Account</h4>
                        <p className={`${themeClasses.textMuted} text-sm`}>Account has been funded and is live trading</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.isLiveFunded}
                        onChange={(e) => setSettings({...settings, isLiveFunded: e.target.checked})}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {settings.isLiveFunded && (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`${themeClasses.text} font-medium`}>First Payout Received</h4>
                          <p className={`${themeClasses.textMuted} text-sm`}>MLL resets to $0 after first payout</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.firstPayoutReceived}
                          onChange={(e) => setSettings({...settings, firstPayoutReceived: e.target.checked})}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center mb-4">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <h3 className={`${themeClasses.text} font-medium`}>Broker Integration</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Broker Sync Toggle */}
                    <div className={`p-4 rounded-lg border ${settings.brokerSyncEnabled ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className={`${themeClasses.text} font-medium`}>Enable Broker Sync</h4>
                          <p className={`${themeClasses.textMuted} text-sm`}>Connect with your broker for automatic account data synchronization</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.brokerSyncEnabled}
                          onChange={(e) => setSettings({...settings, brokerSyncEnabled: e.target.checked})}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>
                      
                      {settings.brokerSyncEnabled && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className={`${themeClasses.text} font-medium`}>Auto-Sync</h4>
                              <p className={`${themeClasses.textMuted} text-sm`}>Automatically sync account balance and trades in real-time</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={settings.autoSyncEnabled}
                              onChange={(e) => setSettings({...settings, autoSyncEnabled: e.target.checked})}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                            />
                          </div>
                          
                          {/* Future Broker Options Placeholder */}
                          <div className="mt-4">
                            <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Broker Platform</label>
                            <select
                              className={`${themeClasses.input} [&>option]:bg-slate-800 [&>option]:text-white`}
                              disabled
                            >
                              <option value="">Select your broker (Coming Soon)</option>
                              <option value="tradovate">Tradovate</option>
                              <option value="ninjatrader">NinjaTrader</option>
                              <option value="tastyworks">Tastyworks</option>
                              <option value="interactive_brokers">Interactive Brokers</option>
                              <option value="other">Other</option>
                            </select>
                            <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
                              Broker integrations coming soon. Currently using manual data entry.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                disabled={saving || loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}