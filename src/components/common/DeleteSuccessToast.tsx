import React, { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteSuccessToastProps {
  itemType: 'class' | 'student'
  itemName: string
  onUndo?: () => void
  onDismiss: () => void
  showUndo?: boolean
}

export function DeleteSuccessToast({
  itemType,
  itemName,
  onUndo,
  onDismiss,
  showUndo = false
}: DeleteSuccessToastProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {itemType === 'class' ? 'Class' : 'Student'} deleted successfully
          </p>
          <p className="text-sm text-green-600 dark:text-green-300">
            "{itemName}" has been removed from your {itemType === 'class' ? 'classes' : 'students'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showUndo && onUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/20"
          >
            Undo
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/20"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Enhanced success animation component
export function DeleteSuccessAnimation({ 
  isVisible, 
  onComplete 
}: { 
  isVisible: boolean
  onComplete: () => void 
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Deleted successfully!</span>
        </div>
      </div>
    </div>
  )
}