import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { Trash2 } from 'lucide-react'

interface DeleteItemOverlayProps {
  isDeleting: boolean
  isCalculatingImpact: boolean
  className?: string
}

export function DeleteItemOverlay({ 
  isDeleting, 
  isCalculatingImpact, 
  className = "" 
}: DeleteItemOverlayProps) {
  if (!isDeleting && !isCalculatingImpact) return null

  return (
    <div className={`absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 ${className}`}>
      <div className="flex flex-col items-center gap-2 text-center">
        {isDeleting ? (
          <>
            <div className="flex items-center gap-2 text-destructive">
              <LoadingSpinner size="sm" className="text-destructive" />
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-destructive">
              Deleting...
            </span>
          </>
        ) : (
          <>
            <LoadingSpinner size="sm" className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Calculating impact...
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Hook to manage item-specific loading states
export function useDeleteItemState(itemId: string, currentDeleteId: string | null) {
  const isCurrentItem = currentDeleteId === itemId
  
  return {
    isCurrentItem,
    shouldShowOverlay: isCurrentItem,
    shouldDisableActions: !!currentDeleteId, // Disable all actions when any item is being processed
  }
}