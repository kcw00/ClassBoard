import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout'
import { AppDataProvider } from './context/AppDataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from './components/ui/sonner'
import LaunchScreen from './screens/auth/LaunchScreen'
import LoginPage from './screens/auth/LoginPage'

// Import existing web components
import Dashboard from './screens/dashboard/Dashboard'
import ClassManagement from './screens/management/ClassManagement'
import ClassDetails from './screens/details/ClassDetails'
import StudentManagement from './screens/management/StudentManagement'
import StudentDetails from './screens/details/StudentDetails'
import CalendarView from './screens/CalendarView'
import AttendanceManagement from './screens/management/AttendanceManagement'
import TestManagement from './screens/management/TestManagement'
import TestDetails from './screens/details/TestDetails'
import MeetingManagement from './screens/management/MeetingManagement'

// Protected Routes Component
function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/classes/:id" element={<ClassDetails />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/attendance" element={<AttendanceManagement />} />
        <Route path="/tests" element={<TestManagement />} />
        <Route path="/tests/:id" element={<TestDetails />} />
        <Route path="/meetings" element={<MeetingManagement />} />
        {/* Catch-all route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

// Main App Content
function AppContent() {
  const { isAuthenticated, showLaunchScreen, dismissLaunchScreen, resetToLaunchScreen, login, isLoading } = useAuth()

  // Show launch screen first
  if (showLaunchScreen && !isAuthenticated) {
    return (
      <LaunchScreen 
        onGetStarted={dismissLaunchScreen} 
      />
    )
  }

  // Show login page if not authenticated and launch screen is dismissed
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={login}
        onBack={resetToLaunchScreen}
        isLoading={isLoading}
      />
    )
  }

  // Show protected app if authenticated
  return <ProtectedRoutes />
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppDataProvider>
          <AppContent />
          <Toaster />
        </AppDataProvider>
      </AuthProvider>
    </Router>
  )
}