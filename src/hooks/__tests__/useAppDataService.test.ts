import { renderHook, act, waitFor } from '@testing-library/react'
import * as AppDataServiceModule from '@/services/AppDataService'

// Mock the AppDataService before importing the hook
jest.mock('@/services/AppDataService', () => {
  const mockAppDataService = {
    getClasses: jest.fn(),
    getStudents: jest.fn(),
    getSchedules: jest.fn(),
    getScheduleExceptions: jest.fn(),
    getMeetings: jest.fn(),
    getAttendanceRecords: jest.fn(),
    getClassNotes: jest.fn(),
    getTests: jest.fn(),
    getTestResults: jest.fn(),
    getHomeworkAssignments: jest.fn(),
    getHomeworkSubmissions: jest.fn(),
    addClass: jest.fn(),
    addStudent: jest.fn(),
    updateStudent: jest.fn(),
    deleteStudent: jest.fn(),
    updateClass: jest.fn(),
    enrollStudent: jest.fn(),
    unenrollStudent: jest.fn(),
    clearCache: jest.fn(),
    subscribeToLoadingStates: jest.fn(() => () => { }),
    isLoading: jest.fn()
  }

  return {
    appDataService: mockAppDataService,
    ApiError: class ApiError extends Error {
      constructor(message: string, public status?: number, public code?: string) {
        super(message)
        this.name = 'ApiError'
      }
    },
    NetworkError: class NetworkError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'NetworkError'
      }
    }
  }
})

// Import the hook after mocking
import { useAppDataService } from '../useAppDataService'

// Get the mocked service for test setup
const mockAppDataService = (AppDataServiceModule as any).appDataService

describe('useAppDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    mockAppDataService.getClasses.mockResolvedValue([])
    mockAppDataService.getStudents.mockResolvedValue([])
    mockAppDataService.getSchedules.mockResolvedValue([])
    mockAppDataService.getScheduleExceptions.mockResolvedValue([])
    mockAppDataService.getMeetings.mockResolvedValue([])
    mockAppDataService.getAttendanceRecords.mockResolvedValue([])
    mockAppDataService.getClassNotes.mockResolvedValue([])
    mockAppDataService.getTests.mockResolvedValue([])
    mockAppDataService.getTestResults.mockResolvedValue([])
    mockAppDataService.getHomeworkAssignments.mockResolvedValue([])
    mockAppDataService.getHomeworkSubmissions.mockResolvedValue([])
  })

  it('should initialize with empty data and loading states', () => {
    const { result } = renderHook(() => useAppDataService())

    expect(result.current.data.classes).toEqual([])
    expect(result.current.data.students).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('should load initial data on mount', async () => {
    const mockClasses = [{
      id: '1',
      name: 'Test Class',
      subject: 'Math',
      description: 'Test',
      room: 'Room 1',
      capacity: 20,
      enrolledStudents: [],
      createdDate: '2024-01-01',
      color: '#blue'
    }]
    const mockStudents = [{
      id: '1',
      name: 'Test Student',
      email: 'test@example.com',
      phone: '123-456-7890',
      grade: '10th Grade',
      parentContact: '123-456-7891',
      enrollmentDate: '2024-01-01'
    }]

    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.getStudents.mockResolvedValue(mockStudents)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    expect(result.current.data.classes).toEqual(mockClasses)
    expect(result.current.data.students).toEqual(mockStudents)
    expect(mockAppDataService.getClasses).toHaveBeenCalled()
    expect(mockAppDataService.getStudents).toHaveBeenCalled()
  })

  it('should handle errors during data loading', async () => {
    const error = new AppDataServiceModule.ApiError('Failed to load classes')
    mockAppDataService.getClasses.mockRejectedValue(error)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.errors.classes).toBe('Failed to load classes')
    })

    expect(result.current.isInitialLoading).toBe(false)
  })

  it('should perform optimistic updates for addClass', async () => {
    const newClassData = {
      name: 'New Class',
      subject: 'Math',
      description: 'Test',
      room: 'Room 1',
      capacity: 20,
      color: '#blue'
    }

    const createdClass = {
      id: '2',
      ...newClassData,
      enrolledStudents: [],
      createdDate: '2024-01-01'
    }

    mockAppDataService.addClass.mockResolvedValue(createdClass)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    await act(async () => {
      const resultClass = await result.current.actions.addClass(newClassData)
      expect(resultClass).toEqual(createdClass)
    })

    expect(mockAppDataService.addClass).toHaveBeenCalledWith(newClassData)
    expect(result.current.data.classes).toContainEqual(createdClass)
  })

  it('should revert optimistic updates on error', async () => {
    const newClassData = {
      name: 'New Class',
      subject: 'Math',
      description: 'Test',
      room: 'Room 1',
      capacity: 20,
      color: '#blue'
    }

    const error = new AppDataServiceModule.ApiError('Failed to create class')
    mockAppDataService.addClass.mockRejectedValue(error)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    const initialClassCount = result.current.data.classes.length

    await act(async () => {
      try {
        await result.current.actions.addClass(newClassData)
      } catch (e) {
        // Expected to throw
      }
    })

    // Should revert to original state
    expect(result.current.data.classes).toHaveLength(initialClassCount)
  })

  it('should perform optimistic updates for updateStudent', async () => {
    const mockStudents = [
      {
        id: '1',
        name: 'Original Name',
        email: 'test@example.com',
        phone: '123',
        grade: '10th',
        parentContact: '456',
        enrollmentDate: '2024-01-01'
      }
    ]

    mockAppDataService.getStudents.mockResolvedValue(mockStudents)
    mockAppDataService.updateStudent.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    const updates = { name: 'Updated Name' }

    await act(async () => {
      await result.current.actions.updateStudent('1', updates)
    })

    expect(mockAppDataService.updateStudent).toHaveBeenCalledWith('1', updates)
    expect(result.current.data.students[0].name).toBe('Updated Name')
  })

  it('should handle deleteStudent with cascading updates', async () => {
    const mockStudents = [
      {
        id: '1',
        name: 'Test Student',
        email: 'test@example.com',
        phone: '123',
        grade: '10th',
        parentContact: '456',
        enrollmentDate: '2024-01-01'
      }
    ]

    const mockClasses = [
      {
        id: '1',
        name: 'Test Class',
        subject: 'Math',
        description: 'Test',
        room: 'Room 1',
        capacity: 20,
        enrolledStudents: ['1'],
        createdDate: '2024-01-01',
        color: '#blue'
      }
    ]

    mockAppDataService.getStudents.mockResolvedValue(mockStudents)
    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.deleteStudent.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    await act(async () => {
      await result.current.actions.deleteStudent('1')
    })

    expect(mockAppDataService.deleteStudent).toHaveBeenCalledWith('1')
    expect(result.current.data.students).toHaveLength(0)
    expect(result.current.data.classes[0].enrolledStudents).not.toContain('1')
  })

  it('should handle enrollStudent optimistically', async () => {
    const mockClasses = [
      {
        id: '1',
        name: 'Test Class',
        subject: 'Math',
        description: 'Test',
        room: 'Room 1',
        capacity: 20,
        enrolledStudents: [],
        createdDate: '2024-01-01',
        color: '#blue'
      }
    ]

    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.enrollStudent.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    await act(async () => {
      await result.current.actions.enrollStudent('1', 'student1')
    })

    expect(mockAppDataService.enrollStudent).toHaveBeenCalledWith('1', 'student1')
    expect(result.current.data.classes[0].enrolledStudents).toContain('student1')
  })

  it('should handle unenrollStudent optimistically', async () => {
    const mockClasses = [
      {
        id: '1',
        name: 'Test Class',
        subject: 'Math',
        description: 'Test',
        room: 'Room 1',
        capacity: 20,
        enrolledStudents: ['student1'],
        createdDate: '2024-01-01',
        color: '#blue'
      }
    ]

    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.unenrollStudent.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    await act(async () => {
      await result.current.actions.unenrollStudent('1', 'student1')
    })

    expect(mockAppDataService.unenrollStudent).toHaveBeenCalledWith('1', 'student1')
    expect(result.current.data.classes[0].enrolledStudents).not.toContain('student1')
  })

  it('should refresh all data', async () => {
    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false)
    })

    // Clear previous calls
    jest.clearAllMocks()

    await act(async () => {
      await result.current.actions.refreshData()
    })

    expect(mockAppDataService.getClasses).toHaveBeenCalled()
    expect(mockAppDataService.getStudents).toHaveBeenCalled()
    expect(mockAppDataService.getSchedules).toHaveBeenCalled()
  })

  it('should clear cache', () => {
    const { result } = renderHook(() => useAppDataService())

    act(() => {
      result.current.actions.clearCache()
    })

    expect(mockAppDataService.clearCache).toHaveBeenCalled()
  })

  it('should clear errors after timeout', async () => {
    jest.useFakeTimers()

    const error = new AppDataServiceModule.ApiError('Test error')
    mockAppDataService.getClasses.mockRejectedValue(error)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.errors.classes).toBe('Test error')
    })

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(result.current.errors.classes).toBeUndefined()
    })

    jest.useRealTimers()
  })

  it('should handle network errors', async () => {
    const error = new AppDataServiceModule.NetworkError('Network connection failed')
    mockAppDataService.getClasses.mockRejectedValue(error)

    const { result } = renderHook(() => useAppDataService())

    await waitFor(() => {
      expect(result.current.errors.classes).toBe('Network connection failed. Please check your internet connection.')
    })
  })
})