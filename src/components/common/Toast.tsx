import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    if ((newToast.duration ?? 5000) > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration ?? 5000)
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
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    const iconClass = "h-4 w-4"
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />
      case 'error':
        return <XCircle className={`${iconClass} text-red-600`} />
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />
      default:
        return <Info className={iconClass} />
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
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ scale: 1.02 }}
    >
      <Alert variant={getVariant()} className="relative pr-8 shadow-lg border-l-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {getIcon()}
        </motion.div>
        <div className="flex-1">
          {toast.title && (
            <motion.div 
              className="font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {toast.title}
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AlertDescription>{toast.message}</AlertDescription>
          </motion.div>
          {toast.action && (
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="sm"
                variant="outline"
                onClick={toast.action.onClick}
                className="hover:scale-105 transition-transform"
              >
                {toast.action.label}
              </Button>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-transparent hover:text-muted-foreground"
            onClick={() => onRemove(toast.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      </Alert>
    </motion.div>
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