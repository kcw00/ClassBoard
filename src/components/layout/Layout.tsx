import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useAuth } from '@/context/AuthContext'
import { 
  Menu, 
  Home, 
  Calendar, 
  Users, 
  GraduationCap, 
  CheckCircle, 
  FileText, 
  MessageSquare,
  LogOut,
  User,
  Settings,
  X
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Classes', href: '/classes', icon: GraduationCap },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Attendance', href: '/attendance', icon: CheckCircle },
  { name: 'Tests', href: '/tests', icon: FileText },
  { name: 'Meetings', href: '/meetings', icon: MessageSquare },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle window resize to update desktop state
  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 1024
      setIsDesktop(newIsDesktop)
      
      // Auto-close mobile sidebar on desktop resize
      if (newIsDesktop && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold">Classboard</h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* User Menu in Sidebar (Mobile) */}
      <div className="border-t p-4 lg:hidden">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">
              {user ? getUserInitials(user.name) : 'T'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Push-style layout */}
      {isDesktop && (
        <div 
          className={`flex-shrink-0 bg-background border-r transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <div className="w-64 h-full flex flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <h1 className="text-xl font-bold">Classboard</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen && !isDesktop} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0" aria-describedby={undefined}>
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content - Width adjusts based on sidebar state */}
      <div id="main-content" className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <h1 className="text-xl font-bold">Classboard</h1>
          <div className="w-8"> {/* Spacer to center title */}</div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex h-16 items-center justify-between border-b px-6">
          {/* Sidebar toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user ? getUserInitials(user.name) : 'T'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}