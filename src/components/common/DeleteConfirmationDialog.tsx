import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

interface ImpactItem {
  type: string;
  count: number;
  description: string;
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  impactInfo?: {
    affectedItems: ImpactItem[];
    hasAssociatedData: boolean;
    warningMessage?: string;
  };
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  impactInfo,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent
        className="sm:max-w-md"
        aria-describedby="delete-dialog-description"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription id="delete-dialog-description">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Item name display */}
        <div className="rounded-md bg-muted p-3">
          <p className="font-medium text-sm">
            Item to delete: <span className="text-destructive">{itemName}</span>
          </p>
        </div>

        {/* Impact information */}
        {impactInfo && impactInfo.hasAssociatedData && (
          <div className="space-y-3">
            {impactInfo.warningMessage && (
              <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  {impactInfo.warningMessage}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                This action will also affect:
              </p>
              <ul className="space-y-1" role="list">
                {impactInfo.affectedItems.map((item, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span>{item.description}</span>
                    <span className="font-medium text-destructive">
                      {item.count} {item.count === 1 ? 'item' : 'items'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Safe deletion message */}
        {impactInfo && !impactInfo.hasAssociatedData && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              This item has no associated data and can be safely deleted.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="sm:mr-2"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}