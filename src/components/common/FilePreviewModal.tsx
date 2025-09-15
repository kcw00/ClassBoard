import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import { Download, FileText, X } from "lucide-react"
import { toast } from "sonner"

interface FileAttachment {
  name: string
  type: string
  size: number
  url: string
}

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: FileAttachment | null
  title?: string
}

export default function FilePreviewModal({ isOpen, onClose, file, title }: FilePreviewModalProps) {
  // Don't render the dialog if no file is provided
  if (!file) return null

  // Check if file is an image
  const isImageFile = (file: FileAttachment) => {
    return file.type.startsWith('image/')
  }

  // Check if file is a PDF
  const isPDFFile = (file: FileAttachment) => {
    return file.type === 'application/pdf'
  }

  // Handle download
  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Downloaded ${file.name}`)
    } catch (error) {
      toast.error("Failed to download file")
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby="file-preview-description">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle className="text-lg">
                {title || "File Preview"}
              </DialogTitle>
              <DialogDescription id="file-preview-description" className="flex items-center gap-2 mt-1">
                <span>{file.name}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="capitalize">{file.type.split('/')[1] || file.type}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* File Preview Content */}
        <div className="flex-1 min-h-0 px-6">
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {isImageFile(file) && (
              <div className="flex items-center justify-center min-h-[400px] p-4">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[60vh] object-contain rounded border bg-white shadow-sm"
                  onError={() => toast.error("Failed to load image")}
                />
              </div>
            )}

            {isPDFFile(file) && (
              <div className="min-h-[400px]">
                <iframe
                  src={file.url}
                  className="w-full h-[60vh] border-0"
                  title={file.name}
                  onError={() => toast.error("Failed to load PDF")}
                />
              </div>
            )}

            {/* Fallback for unsupported file types */}
            {!isImageFile(file) && !isPDFFile(file) && (
              <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Preview not available</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  This file type cannot be previewed directly. You can download it to view the contents.
                </p>
                <Button onClick={handleDownload} className="mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {isImageFile(file) && "Image files can be zoomed using browser controls"}
              {isPDFFile(file) && "Use browser PDF controls for navigation and zoom"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}