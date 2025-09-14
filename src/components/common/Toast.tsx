import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = () => {
    switch (toast.type) {
      case 'error':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <Alert variant={getVariant()} className="relative pr-8 shadow-lg">
      {getIcon()}
      <div className="flex-1">
        {toast.title && (
          <div className="font-medium">{toast.title}</div>
        )}
        <AlertDescription>{toast.message}</AlertDescription>
        {toast.action && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => onRemove(toast.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  )
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string) => {
    return addToast({ type: 'success', message, title })
  }, [addToast])
}

export function useErrorToast() {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string, action?: Toast['action']) => {
    return addToast({ type: 'error', message, title, action, duration: 0 }) // Don't auto-dismiss errors
  }, [addToast])
}

export function useWarningToast() {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string) => {
    return addToast({ type: 'warning', message, title })
  }, [addToast])
}

export function useInfoToast() {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string) => {
    return addToast({ type: 'info', message, title })
  }, [addToast])
}