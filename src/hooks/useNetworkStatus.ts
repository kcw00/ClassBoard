import { useState, useEffect } from 'react'

export type NetworkStatus = 'online' | 'offline' | 'slow'

interface NetworkInfo {
  status: NetworkStatus
  isOnline: boolean
  isOffline: boolean
  isSlow: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export function useNetworkStatus(): NetworkInfo {
  const [status, setStatus] = useState<NetworkStatus>('online')
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string
    downlink?: number
    rtt?: number
  }>({})

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine
      
      if (!isOnline) {
        setStatus('offline')
        return
      }

      // Check for slow connection using Network Information API
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      if (connection) {
        const { effectiveType, downlink, rtt } = connection
        
        setNetworkInfo({
          effectiveType,
          downlink,
          rtt
        })

        // Determine if connection is slow
        const isSlow = effectiveType === 'slow-2g' || 
                      effectiveType === '2g' || 
                      (downlink && downlink < 0.5) ||
                      (rtt && rtt > 2000)

        setStatus(isSlow ? 'slow' : 'online')
      } else {
        setStatus('online')
      }
    }

    // Initial check
    updateNetworkStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    ...networkInfo
  }
}

// Hook for monitoring network status during operations
export function useOperationNetworkStatus() {
  const networkStatus = useNetworkStatus()
  const [operationStartTime, setOperationStartTime] = useState<number | null>(null)
  const [isOperationSlow, setIsOperationSlow] = useState(false)

  const startOperation = () => {
    setOperationStartTime(Date.now())
    setIsOperationSlow(false)
  }

  const endOperation = () => {
    setOperationStartTime(null)
    setIsOperationSlow(false)
  }

  useEffect(() => {
    if (operationStartTime) {
      const timer = setTimeout(() => {
        setIsOperationSlow(true)
      }, 5000) // Consider operation slow after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [operationStartTime])

  return {
    ...networkStatus,
    startOperation,
    endOperation,
    isOperationSlow,
    operationDuration: operationStartTime ? Date.now() - operationStartTime : 0
  }
}