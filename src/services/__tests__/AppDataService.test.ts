// Jest globals (describe, it, beforeEach, afterEach, expect) are available automatically
import { AppDataService, ApiError, NetworkError } from '../AppDataService'
import type { Class, Student } from '@/types'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock import.meta.env for Vite
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3001/api'
      }
    }
  }
})

describe('AppDataService', () => {
  let service: AppDataService

  beforeEach(() => {
    service = new AppDataService()
    mockFetch.mockClear()
    mockLocalStorage.getItem.mockClear()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Basic API Operations', () => {
    it('should make successful GET request for classes', async () => {
      const mockData = [{ id: '1', name: 'Test Class' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockData })
      })

      const result = await service.getClasses()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/classes'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should include auth token in headers when available', async () => {
      const token = 'test-token'
      mockLocalStorage.getItem.mockReturnValue(token)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: [] })
      })

      await service.getClasses()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      )
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Not found',
          code: 'NOT_FOUND'
        })
      })

      await expect(service.getClasses()).rejects.toThrow(ApiError)
      await expect(service.getClasses()).rejects.toThrow('Not found')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(service.getClasses()).rejects.toThrow(NetworkError)
    })

    it('should retry on failure', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true, data: [] })
        })

      const result = await service.getClasses()

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual([])
    })

    it('should not retry on client errors (4xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ success: false, error: 'Bad request' })
      })

      await expect(service.getClasses()).rejects.toThrow(ApiError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockData = [{ id: '1', name: 'Test Class' }]
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockData })
      })

      // First call
      const result1 = await service.getClasses()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const result2 = await service.getClasses()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('should invalidate cache on mutations', async () => {
      const mockData = [{ id: '1', name: 'Test Class' }]
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockData })
      })

      // Get classes (cached)
      await service.getClasses()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Add class (should invalidate cache)
      await service.addClass({
        name: 'New Class',
        subject: 'Math',
        description: 'Test',
        room: 'Room 1',
        capacity: 20,
        color: '#blue'
      })

      // Get classes again (should make new request)
      await service.getClasses()
      expect(mockFetch).toHaveBeenCalledTimes(3) // GET, POST, GET
    })

    it('should clear all cache', () => {
      expect(() => service.clearCache()).not.toThrow()
    })
  })

  describe('Loading States', () => {
    it('should track loading states', async () => {
      const unsubscribe = service.subscribeToLoadingStates(() => {
        // Loading states callback
      })

      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({ success: true, data: [] })
          }), 100)
        )
      )

      const promise = service.getClasses()

      // Should be loading
      expect(service.isLoading('GET:/classes')).toBe(true)

      await promise

      // Should not be loading
      expect(service.isLoading('GET:/classes')).toBe(false)

      unsubscribe()
    })
  })

  describe('Classes API', () => {
    const mockClass: Class = {
      id: '1',
      name: 'Test Class',
      subject: 'Math',
      description: 'Test description',
      room: 'Room 1',
      capacity: 20,
      enrolledStudents: [],
      createdDate: '2024-01-01',
      color: '#blue'
    }

    it('should get classes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: [mockClass] })
      })

      const result = await service.getClasses()
      expect(result).toEqual([mockClass])
    })

    it('should get single class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockClass })
      })

      const result = await service.getClass('1')
      expect(result).toEqual(mockClass)
    })

    it('should add class', async () => {
      const newClassData = {
        name: 'New Class',
        subject: 'Science',
        description: 'New description',
        room: 'Room 2',
        capacity: 25,
        color: '#red'
      }

      const createdClass = {
        ...newClassData,
        id: '2',
        enrolledStudents: [],
        createdDate: '2024-01-01'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: createdClass })
      })

      const result = await service.addClass(newClassData)
      expect(result.name).toBe(newClassData.name)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/classes'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newClassData)
        })
      )
    })

    it('should update class', async () => {
      const updates = { name: 'Updated Class' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: { ...mockClass, ...updates } })
      })

      const result = await service.updateClass('1', updates)
      expect(result.name).toBe(updates.name)
    })

    it('should delete class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

      await service.deleteClass('1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/classes/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should enroll student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

      await service.enrollStudent('1', 'student1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/classes/1/enroll'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ studentId: 'student1' })
        })
      )
    })

    it('should unenroll student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

      await service.unenrollStudent('1', 'student1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/classes/1/students/student1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('Students API', () => {
    const mockStudent: Student = {
      id: '1',
      name: 'Test Student',
      email: 'test@example.com',
      phone: '123-456-7890',
      grade: '10th Grade',
      parentContact: '123-456-7891',
      enrollmentDate: '2024-01-01'
    }

    it('should get students', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: [mockStudent] })
      })

      const result = await service.getStudents()
      expect(result).toEqual([mockStudent])
    })

    it('should add student', async () => {
      const newStudentData = {
        name: 'New Student',
        email: 'new@example.com',
        phone: '123-456-7890',
        grade: '11th Grade',
        parentContact: '123-456-7891'
      }

      const createdStudent = {
        ...newStudentData,
        id: '2',
        enrollmentDate: '2024-01-01'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: createdStudent })
      })

      const result = await service.addStudent(newStudentData)
      expect(result.name).toBe(newStudentData.name)
    })

    it('should update student', async () => {
      const updates = { name: 'Updated Student' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: { ...mockStudent, ...updates } })
      })

      const result = await service.updateStudent('1', updates)
      expect(result.name).toBe(updates.name)
    })

    it('should delete student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

      await service.deleteStudent('1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/students/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { field: 'name' }
        })
      })

      try {
        await service.getClasses()
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Validation failed')
        expect((error as ApiError).status).toBe(400)
        expect((error as ApiError).code).toBe('VALIDATION_ERROR')
        expect((error as ApiError).details).toEqual({ field: 'name' })
      }
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      try {
        await service.getClasses()
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError)
        expect((error as NetworkError).message).toBe('Network connection failed')
      }
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(() => {
          // Never resolves to simulate timeout
        })
      )

      const promise = service.getClasses()
      jest.advanceTimersByTime(10000)

      await expect(promise).rejects.toThrow()
    })
  })
})