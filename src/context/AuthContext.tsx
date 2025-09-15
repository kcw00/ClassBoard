import React, { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

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
    const hasSeenLaunch = localStorage.getItem("classboard_seen_launch")
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setShowLaunchScreen(false) // Skip launch screen if already logged in
      } catch (error) {
        console.error("Failed to parse saved user data:", error)
        localStorage.removeItem("classboard_user")
      }
    } else if (hasSeenLaunch) {
      setShowLaunchScreen(false)
    }
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Demo credentials check
      if (credentials.email === "teacher@classboard.com" && credentials.password === "demo123") {
        const userData: User = {
          id: "demo-user-1",
          email: credentials.email,
          name: "Demo Teacher",
          role: "teacher"
        }
        
        setUser(userData)
        localStorage.setItem("classboard_user", JSON.stringify(userData))
        localStorage.setItem("classboard_seen_launch", "true")
        setShowLaunchScreen(false)
        
        toast.success(`Welcome back, ${userData.name}!`)
      } else {
        // For demo purposes, we'll accept any email/password combination
        // In a real app, this would make an actual API call
        const userData: User = {
          id: "user-" + Date.now(),
          email: credentials.email,
          name: credentials.email.split("@")[0].replace(/[._]/g, " "),
          role: "teacher"
        }
        
        setUser(userData)
        localStorage.setItem("classboard_user", JSON.stringify(userData))
        localStorage.setItem("classboard_seen_launch", "true")
        setShowLaunchScreen(false)
        
        toast.success(`Welcome, ${userData.name}!`)
      }
    } catch (error) {
      toast.error("Login failed. Please try again.")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("classboard_user")
    toast.success("You've been logged out successfully")
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