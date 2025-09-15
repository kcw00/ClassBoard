import React, { createContext, useContext, useState, useEffect } from "react"

export interface User {
  id: string
  email: string
  name: string
  role: "teacher" | "admin"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  showLaunchScreen: boolean
  dismissLaunchScreen: () => void
  resetToLaunchScreen: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLaunchScreen, setShowLaunchScreen] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("classboard_user")
    const savedToken = localStorage.getItem("authToken")
    const hasSeenLaunch = localStorage.getItem("classboard_seen_launch")

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setShowLaunchScreen(false) // Skip launch screen if already logged in
      } catch (error) {
        console.error("Failed to parse saved user data:", error)
        localStorage.removeItem("classboard_user")
        localStorage.removeItem("authToken")
      }
    } else if (hasSeenLaunch) {
      setShowLaunchScreen(false)
    }
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true)

    try {
      // Get API base URL from environment or fallback to localhost
      const getApiUrl = () => {
        if (import.meta.env.VITE_API_URL) {
          return import.meta.env.VITE_API_URL
        }
        if (import.meta.env.VITE_API_URL_DEV) {
          return import.meta.env.VITE_API_URL_DEV
        }
        return 'http://localhost:3001'
      }
      const apiBaseUrl = getApiUrl()

      // Make real API call to login endpoint
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()

      if (data.success && data.data) {
        const { user, token } = data.data

        setUser(user)
        localStorage.setItem("classboard_user", JSON.stringify(user))
        localStorage.setItem("classboard_seen_launch", "true")
        localStorage.setItem("authToken", token)
        setShowLaunchScreen(false)

        console.log(`Welcome back, ${user.name}!`)
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("classboard_user")
    localStorage.removeItem("authToken")
    console.log("You've been logged out successfully")
  }

  const dismissLaunchScreen = () => {
    setShowLaunchScreen(false)
    localStorage.setItem("classboard_seen_launch", "true")
  }

  const resetToLaunchScreen = () => {
    setShowLaunchScreen(true)
    localStorage.removeItem("classboard_seen_launch")
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    showLaunchScreen,
    dismissLaunchScreen,
    resetToLaunchScreen
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}