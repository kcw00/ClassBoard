// Import types from a separate types file instead of mockData
import type {
  Class,
  Student,
  Schedule,
  ScheduleException,
  Meeting,
  AttendanceRecord,
  ClassNote,
  Test,
  TestResult,
  HomeworkAssignment,
  HomeworkSubmission
} from '@/types'

// API Response types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface QueryOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Configuration
const getApiBaseUrl = () => {
  // Handle both Vite (import.meta.env) and Jest (process.env) environments
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL
  }
  return 'http://localhost:3001/api'
}
const API_BASE_URL = getApiBaseUrl()
const DEFAULT_TIMEOUT = 10000 // 10 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Cache configuration
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    )
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Loading state management
interface LoadingState {
  [key: string]: boolean
}

class LoadingManager {
  private loadingStates: LoadingState = {}
  private listeners: Array<(states: LoadingState) => void> = []

  setLoading(key: string, loading: boolean): void {
    this.loadingStates[key] = loading
    this.notifyListeners()
  }

  isLoading(key: string): boolean {
    return this.loadingStates[key] || false
  }

  getLoadingStates(): LoadingState {
    return { ...this.loadingStates }
  }

  subscribe(listener: (states: LoadingState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getLoadingStates()))
  }
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AppDataService {
  private cache = new ApiCache()
  private loadingManager = new LoadingManager()

  // Utility method for making HTTP requests with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = true,
    cacheKey?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const key = cacheKey || `${options.method || 'GET'}:${endpoint}`

    // Set loading state
    this.loadingManager.setLoading(key, true)

    try {
      // Check cache for GET requests
      if (useCache && (!options.method || options.method === 'GET')) {
        const cached = this.cache.get<T>(key)
        if (cached) {
          this.loadingManager.setLoading(key, false)
          return cached
        }
      }

      // Default headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {})
      }

      // Add auth token if available
      const token = localStorage.getItem('authToken')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      let lastError: Error = new Error('Request failed')

      // Debug logging
      console.log(`[AppDataService] ${options.method || 'GET'} ${url} (attempt ${1}/${MAX_RETRIES})`)

      // Retry logic
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          // Debug logging for response
          console.log(`[AppDataService] Response: ${response.status} ${response.statusText}`)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error(`[AppDataService] Error ${response.status}:`, errorData)
            throw new ApiError(
              errorData.message || `HTTP ${response.status}`,
              response.status,
              errorData.code,
              errorData.details
            )
          }

          const data: ApiResponse<T> = await response.json()

          if (!data.success) {
            throw new ApiError(data.error || 'API request failed')
          }

          const result = data.data as T

          // Cache successful GET requests
          if (useCache && (!options.method || options.method === 'GET')) {
            this.cache.set(key, result)
          }

          // Invalidate related cache entries for mutations
          if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
            const resourceType = endpoint.split('/')[1] // Extract resource type from endpoint
            this.cache.invalidate(resourceType)
          }

          this.loadingManager.setLoading(key, false)
          return result

        } catch (error) {
          lastError = error as Error
          console.error(`[AppDataService] Attempt ${attempt} failed:`, error)

          // Don't retry on client errors (4xx) except 408, 429
          if (error instanceof ApiError && error.status) {
            if (error.status >= 400 && error.status < 500 &&
              error.status !== 408 && error.status !== 429) {
              console.log(`[AppDataService] Not retrying client error ${error.status}`)
              break
            }
          }

          // Wait before retry (exponential backoff)
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY * attempt
            console.log(`[AppDataService] Retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      throw lastError

    } catch (error) {
      this.loadingManager.setLoading(key, false)

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed')
      }

      throw new ApiError('Request failed', undefined, undefined, error)
    }
  }

  // Loading state methods
  isLoading(operation: string): boolean {
    return this.loadingManager.isLoading(operation)
  }

  subscribeToLoadingStates(callback: (states: LoadingState) => void): () => void {
    return this.loadingManager.subscribe(callback)
  }

  // Cache management
  clearCache(): void {
    this.cache.invalidate()
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidate(pattern)
  }

  // Classes API methods
  async getClasses(): Promise<Class[]> {
    try {
      return this.makeRequest<Class[]>('/classes')
    } catch (error) {
      console.warn('No classes found, returning empty array')
      return []
    }
  }

  async getClass(id: string): Promise<Class> {
    return this.makeRequest<Class>(`/classes/${id}`)
  }

  async addClass(classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>): Promise<Class> {
    return this.makeRequest<Class>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData)
    }, false)
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class> {
    return this.makeRequest<Class>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteClass(id: string): Promise<void> {
    await this.makeRequest<void>(`/classes/${id}`, {
      method: 'DELETE'
    }, false)
  }

  async enrollStudent(classId: string, studentId: string): Promise<void> {
    await this.makeRequest<void>(`/classes/${classId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    }, false)
  }

  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    await this.makeRequest<void>(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE'
    }, false)
  }

  // Students API methods
  async getStudents(): Promise<Student[]> {
    try {
      return this.makeRequest<Student[]>('/students')
    } catch (error) {
      console.warn('No students found, returning empty array')
      return []
    }
  }

  async getStudent(id: string): Promise<Student> {
    return this.makeRequest<Student>(`/students/${id}`)
  }

  async addStudent(studentData: Omit<Student, 'id' | 'enrollmentDate'>): Promise<Student> {
    // Add current date as enrollmentDate since it's required by the backend
    const studentDataWithEnrollmentDate = {
      ...studentData,
      enrollmentDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }

    return this.makeRequest<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(studentDataWithEnrollmentDate)
    }, false)
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    return this.makeRequest<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteStudent(id: string): Promise<void> {
    await this.makeRequest<void>(`/students/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Schedules API methods
  async getSchedules(): Promise<Schedule[]> {
    // Get all schedules by fetching schedules for each class
    const allSchedules: Schedule[] = []

    try {
      // First get all classes
      const classes = await this.getClasses()

      // Then get schedules for each class
      for (const classItem of classes) {
        try {
          const classSchedules = await this.getSchedulesByClass(classItem.id)
          allSchedules.push(...classSchedules)
        } catch (error) {
          console.warn(`Failed to fetch schedules for class ${classItem.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes for schedule loading:', error)
    }

    return allSchedules
  }

  async getSchedulesByClass(classId: string): Promise<Schedule[]> {
    try {
      const response = await this.makeRequest<Schedule[]>(`/classes/${classId}/schedules`)
      return response
    } catch (error) {
      console.warn(`No schedules found for class ${classId}, returning empty array`)
      return []
    }
  }

  async addSchedule(scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> {
    const { classId, ...scheduleDataWithoutClassId } = scheduleData
    return this.makeRequest<Schedule>(`/classes/${classId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(scheduleDataWithoutClassId)
    }, false)
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    return this.makeRequest<Schedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.makeRequest<void>(`/schedules/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Schedule Exceptions API methods
  async getScheduleExceptions(): Promise<ScheduleException[]> {
    // Get all schedule exceptions by fetching exceptions for each schedule
    const allExceptions: ScheduleException[] = []

    try {
      // First get all schedules
      const schedules = await this.getSchedules()

      // Then get exceptions for each schedule
      for (const schedule of schedules) {
        try {
          const scheduleExceptions = await this.getScheduleExceptionsBySchedule(schedule.id)
          allExceptions.push(...scheduleExceptions)
        } catch (error) {
          console.warn(`Failed to fetch exceptions for schedule ${schedule.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch schedules for exception loading:', error)
    }

    return allExceptions
  }

  async getScheduleExceptionsBySchedule(scheduleId: string): Promise<ScheduleException[]> {
    return this.makeRequest<ScheduleException[]>(`/schedules/${scheduleId}/exceptions`)
  }

  async addScheduleException(exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>): Promise<ScheduleException> {
    const { scheduleId, ...exceptionDataWithoutScheduleId } = exceptionData
    return this.makeRequest<ScheduleException>(`/schedules/${scheduleId}/exceptions`, {
      method: 'POST',
      body: JSON.stringify(exceptionDataWithoutScheduleId)
    }, false)
  }

  async updateScheduleException(id: string, updates: Partial<ScheduleException>): Promise<ScheduleException> {
    return this.makeRequest<ScheduleException>(`/exceptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteScheduleException(id: string): Promise<void> {
    await this.makeRequest<void>(`/exceptions/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Meetings API methods
  async getMeetings(): Promise<Meeting[]> {
    try {
      return this.makeRequest<Meeting[]>('/meetings')
    } catch (error) {
      console.warn('No meetings found, returning empty array')
      return []
    }
  }

  async addMeeting(meetingData: Omit<Meeting, 'id' | 'createdDate'>): Promise<Meeting> {
    return this.makeRequest<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData)
    }, false)
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    return this.makeRequest<Meeting>(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteMeeting(id: string): Promise<void> {
    await this.makeRequest<void>(`/meetings/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Attendance API methods
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      return this.makeRequest<AttendanceRecord[]>('/attendance')
    } catch (error) {
      console.warn('No attendance records found, returning empty array')
      return []
    }
  }

  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    try {
      return this.makeRequest<AttendanceRecord[]>(`/attendance?classId=${classId}`)
    } catch (error) {
      console.warn(`No attendance records found for class ${classId}, returning empty array`)
      return []
    }
  }

  async addAttendanceRecord(attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>): Promise<AttendanceRecord> {
    return this.makeRequest<AttendanceRecord>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    }, false)
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    return this.makeRequest<AttendanceRecord>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  // Class Notes API methods
  async getClassNotes(): Promise<ClassNote[]> {
    try {
      return this.makeRequest<ClassNote[]>('/class-notes')
    } catch (error) {
      console.warn('No class notes found, returning empty array')
      return []
    }
  }

  async getClassNotesByClass(classId: string): Promise<ClassNote[]> {
    try {
      return this.makeRequest<ClassNote[]>(`/class-notes?classId=${classId}`)
    } catch (error) {
      console.warn(`No class notes found for class ${classId}, returning empty array`)
      return []
    }
  }

  async addClassNote(noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>): Promise<ClassNote> {
    return this.makeRequest<ClassNote>('/class-notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    }, false)
  }

  async updateClassNote(id: string, updates: Partial<ClassNote>): Promise<ClassNote> {
    return this.makeRequest<ClassNote>(`/class-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteClassNote(id: string): Promise<void> {
    await this.makeRequest<void>(`/class-notes/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Tests API methods
  async getTests(): Promise<Test[]> {
    try {
      return this.makeRequest<Test[]>('/tests')
    } catch (error) {
      console.warn('No tests found, returning empty array')
      return []
    }
  }

  async getTestsByClass(classId: string): Promise<Test[]> {
    try {
      return this.makeRequest<Test[]>(`/tests?classId=${classId}`)
    } catch (error) {
      console.warn(`No tests found for class ${classId}, returning empty array`)
      return []
    }
  }

  async addTest(testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>): Promise<Test> {
    return this.makeRequest<Test>('/tests', {
      method: 'POST',
      body: JSON.stringify(testData)
    }, false)
  }

  async updateTest(id: string, updates: Partial<Test>): Promise<Test> {
    return this.makeRequest<Test>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteTest(id: string): Promise<void> {
    await this.makeRequest<void>(`/tests/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Test Results API methods
  async getTestResults(): Promise<TestResult[]> {
    try {
      return this.makeRequest<TestResult[]>('/test-results')
    } catch (error) {
      console.warn('No test results found, returning empty array')
      return []
    }
  }

  async getTestResultsByTest(testId: string): Promise<TestResult[]> {
    try {
      return this.makeRequest<TestResult[]>(`/test-results?testId=${testId}`)
    } catch (error) {
      console.warn(`No test results found for test ${testId}, returning empty array`)
      return []
    }
  }

  async addTestResult(resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>): Promise<TestResult> {
    return this.makeRequest<TestResult>('/test-results', {
      method: 'POST',
      body: JSON.stringify(resultData)
    }, false)
  }

  async updateTestResult(id: string, updates: Partial<TestResult>): Promise<TestResult> {
    return this.makeRequest<TestResult>(`/test-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteTestResult(id: string): Promise<void> {
    await this.makeRequest<void>(`/test-results/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Homework Assignments API methods
  async getHomeworkAssignments(): Promise<HomeworkAssignment[]> {
    try {
      return this.makeRequest<HomeworkAssignment[]>('/homework-assignments')
    } catch (error) {
      console.warn('No homework assignments found, returning empty array')
      return []
    }
  }

  async getHomeworkAssignmentsByClass(classId: string): Promise<HomeworkAssignment[]> {
    try {
      return this.makeRequest<HomeworkAssignment[]>(`/homework-assignments?classId=${classId}`)
    } catch (error) {
      console.warn(`No homework assignments found for class ${classId}, returning empty array`)
      return []
    }
  }

  async addHomeworkAssignment(assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkAssignment> {
    return this.makeRequest<HomeworkAssignment>('/homework-assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    }, false)
  }

  async updateHomeworkAssignment(id: string, updates: Partial<HomeworkAssignment>): Promise<HomeworkAssignment> {
    return this.makeRequest<HomeworkAssignment>(`/homework-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteHomeworkAssignment(id: string): Promise<void> {
    await this.makeRequest<void>(`/homework-assignments/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // Homework Submissions API methods
  async getHomeworkSubmissions(): Promise<HomeworkSubmission[]> {
    return this.makeRequest<HomeworkSubmission[]>('/homework-submissions')
  }

  async getHomeworkSubmissionsByAssignment(assignmentId: string): Promise<HomeworkSubmission[]> {
    return this.makeRequest<HomeworkSubmission[]>(`/homework-submissions?assignmentId=${assignmentId}`)
  }

  async addHomeworkSubmission(submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkSubmission> {
    return this.makeRequest<HomeworkSubmission>('/homework-submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData)
    }, false)
  }

  async updateHomeworkSubmission(id: string, updates: Partial<HomeworkSubmission>): Promise<HomeworkSubmission> {
    return this.makeRequest<HomeworkSubmission>(`/homework-submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, false)
  }

  async deleteHomeworkSubmission(id: string): Promise<void> {
    await this.makeRequest<void>(`/homework-submissions/${id}`, {
      method: 'DELETE'
    }, false)
  }

  // App Data Dashboard API methods
  async getAppOverview(): Promise<{
    totalStudents: number
    totalClasses: number
    totalTests: number
    totalHomeworkAssignments: number
    totalMeetings: number
    recentActivity: Array<{
      type: string
      title: string
      description: string
      timestamp: Date
    }>
    upcomingEvents: Array<{
      type: string
      title: string
      date: string
      time?: string
    }>
    systemHealth: {
      status: string
      responseTime: number
      errors24h: number
    }
  }> {
    return this.makeRequest('/app-data/overview')
  }

  async getRecentActivity(limit: number = 20): Promise<Array<{
    type: string
    title: string
    description: string
    timestamp: Date
  }>> {
    return this.makeRequest(`/app-data/recent-activity?limit=${limit}`)
  }

  async getUpcomingEvents(limit: number = 15): Promise<Array<{
    type: string
    title: string
    date: string
    time?: string
  }>> {
    return this.makeRequest(`/app-data/upcoming-events?limit=${limit}`)
  }

  async getClassPerformanceMetrics(): Promise<Array<{
    classId: string
    className: string
    totalStudents: number
    averageAttendance: number
    averageGrade: number
    completedTests: number
    completedHomework: number
    upcomingDeadlines: number
  }>> {
    return this.makeRequest('/app-data/class-performance')
  }

  async getStudentPerformanceMetrics(studentId?: string): Promise<Array<{
    studentId: string
    studentName: string
    overallGrade: number
    attendanceRate: number
    completedTests: number
    completedHomework: number
    upcomingDeadlines: number
    recentActivity: string[]
  }>> {
    const endpoint = studentId
      ? `/app-data/student-performance?studentId=${studentId}`
      : '/app-data/student-performance'
    return this.makeRequest(endpoint)
  }

  async getSystemHealth(): Promise<{
    status: string
    responseTime: number
    errors24h: number
    databaseConnections: number
  }> {
    return this.makeRequest('/app-data/system-health')
  }

  async getAggregatedStats(startDate?: string, endDate?: string): Promise<{
    totalUsers: number
    totalStudents: number
    totalClasses: number
    totalTests: number
    totalHomework: number
    totalMeetings: number
    averageAttendanceRate: number
    averageGradeAcrossAllClasses: number
    mostActiveClasses: Array<{ classId: string; className: string; activityScore: number }>
    topPerformingStudents: Array<{ studentId: string; studentName: string; averageGrade: number }>
  }> {
    let endpoint = '/app-data/stats'
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (params.toString()) endpoint += `?${params.toString()}`

    return this.makeRequest(endpoint)
  }

  async getDashboardSummary(): Promise<{
    overview: {
      totalStudents: number
      totalClasses: number
      totalTests: number
      totalHomeworkAssignments: number
      totalMeetings: number
    }
    recentActivity: Array<{
      type: string
      title: string
      description: string
      timestamp: Date
    }>
    upcomingEvents: Array<{
      type: string
      title: string
      date: string
      time?: string
    }>
    systemHealth: {
      status: string
      responseTime: number
      errors24h: number
    }
  }> {
    return this.makeRequest('/app-data/dashboard-summary')
  }

  // Paginated methods for large datasets
  async getClassesPaginated(options: QueryOptions = {}): Promise<PaginatedResponse<Class>> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.search) params.append('search', options.search)
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const endpoint = params.toString() ? `/classes?${params.toString()}` : '/classes'
    return this.makeRequest<PaginatedResponse<Class>>(endpoint)
  }

  async getStudentsPaginated(options: QueryOptions = {}): Promise<PaginatedResponse<Student>> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.search) params.append('search', options.search)
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const endpoint = params.toString() ? `/students?${params.toString()}` : '/students'
    return this.makeRequest<PaginatedResponse<Student>>(endpoint)
  }
}

// Export singleton instance
export const appDataService = new AppDataService()
export default appDataService