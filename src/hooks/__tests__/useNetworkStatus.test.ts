import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus, useOperationNetworkStatus } from '../useNetworkStatus'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g',
  downlink: 10,
  rtt: 100,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: mockConnection
})

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to online state
    Object.defineProperty(navigator, 'onLine', { value: true })
    mockConnection.effectiveType = '4g'
    mockConnection.downlink = 10
    mockConnection.rtt = 100
  })

  afterEach(() => {
    // Clean up event listeners
    jest.restoreAllMocks()
  })

  it('should return online status when connection is good', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('online')
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isSlow).toBe(false)
  })

  it('should return offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('offline')
    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
    expect(result.current.isSlow).toBe(false)
  })

  it('should return slow status for 2g connection', () => {
    mockConnection.effectiveType = '2g'
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('slow')
    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isSlow).toBe(true)
  })

  it('should return slow status for low downlink', () => {
    mockConnection.downlink = 0.3 // Less than 0.5
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('slow')
    expect(result.current.isSlow).toBe(true)
  })

  it('should return slow status for high RTT', () => {
    mockConnection.rtt = 3000 // Greater than 2000
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('slow')
    expect(result.current.isSlow).toBe(true)
  })

  it('should include network information when available', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.effectiveType).toBe('4g')
    expect(result.current.downlink).toBe(10)
    expect(result.current.rtt).toBe(100)
  })

  it('should handle missing connection API gracefully', () => {
    // Remove connection API
    Object.defineProperty(navigator, 'connection', { value: undefined })
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('online')
    expect(result.current.effectiveType).toBeUndefined()
    expect(result.current.downlink).toBeUndefined()
    expect(result.current.rtt).toBeUndefined()
  })

  it('should set up event listeners for online/offline events', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = renderHook(() => useNetworkStatus())

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should set up connection change listener when available', () => {
    const { unmount } = renderHook(() => useNetworkStatus())

    expect(mockConnection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(mockConnection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('useOperationNetworkStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true })
    mockConnection.effectiveType = '4g'
    mockConnection.downlink = 10
    mockConnection.rtt = 100
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('should track operation timing', () => {
    const { result } = renderHook(() => useOperationNetworkStatus())

    expect(result.current.isOperationSlow).toBe(false)
    expect(result.current.operationDuration).toBe(0)

    act(() => {
      result.current.startOperation()
    })

    // Fast forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(result.current.isOperationSlow).toBe(false)
    expect(result.current.operationDuration).toBeGreaterThan(0)

    // Fast forward past 5 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(result.current.isOperationSlow).toBe(true)

    act(() => {
      result.current.endOperation()
    })

    expect(result.current.isOperationSlow).toBe(false)
    expect(result.current.operationDuration).toBe(0)
  })

  it('should include all network status properties', () => {
    const { result } = renderHook(() => useOperationNetworkStatus())

    expect(result.current.status).toBe('online')
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isSlow).toBe(false)
    expect(result.current.effectiveType).toBe('4g')
    expect(result.current.downlink).toBe(10)
    expect(result.current.rtt).toBe(100)
  })

  it('should reset operation state when starting new operation', () => {
    const { result } = renderHook(() => useOperationNetworkStatus())

    act(() => {
      result.current.startOperation()
    })

    act(() => {
      jest.advanceTimersByTime(6000)
    })

    expect(result.current.isOperationSlow).toBe(true)

    // Start new operation
    act(() => {
      result.current.startOperation()
    })

    expect(result.current.isOperationSlow).toBe(false)
  })
})