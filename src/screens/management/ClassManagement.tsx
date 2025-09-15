import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, MapPin, Clock, Settings, UserPlus, CalendarPlus, Trash2, Edit, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { classColors } from "@/types"
import type { Class } from "@/types"
import { useAppData } from "@/context/AppDataMigrationContext"
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog"
import { calculateClassDeletionImpact, type DeletionImpact } from "@/utils/impactCalculation"
import { 
  handleDeleteError, 
  handleDeleteSuccess, 
  handleImpactCalculationError,
  retryOperation,
  DEFAULT_RETRY_CONFIG
} from "@/utils/errorHandling"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

export default function ClassManagement() {
  const navigate = useNavigate()
  const { data, actions, loading, errors, isInitialLoading } = useAppData()
  const networkStatus = useNetworkStatus()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<Class | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletionImpact, setDeletionImpact] = useState<DeletionImpact | null>(null)
  const [isCalculatingImpact, setIsCalculatingImpact] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    description: "",
    room: "",
    capacity: "",
    color: "#3b82f6"
  })
  const [editFormData, setEditFormData] = useState({
    name: "",
    subject: "",
    description: "",
    room: "",
    capacity: "",
    color: "#3b82f6"
  })
  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await actions.addClass({
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        room: formData.room,
        capacity: parseInt(formData.capacity, 10),
        color: formData.color
      })
      setFormData({ name: "", subject: "", description: "", room: "", capacity: "", color: "#3b82f6" })
      setIsDialogOpen(false)
      setStatusMessage({ type: 'success', message: `Class "${formData.name}" created successfully!` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to create class. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleManageClass = (classItem: Class) => {
    setSelectedClass(classItem)
    setEditFormData({
      name: classItem.name,
      subject: classItem.subject,
      description: classItem.description,
      room: classItem.room,
      capacity: classItem.capacity.toString(),
      color: classItem.color
    })
    setIsManageDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return
    try {
      await actions.updateClass(selectedClass.id, {
        name: editFormData.name,
        subject: editFormData.subject,
        description: editFormData.description,
        room: editFormData.room,
        capacity: parseInt(editFormData.capacity),
        color: editFormData.color
      })
      setIsManageDialogOpen(false)
      setSelectedClass(null)
      setStatusMessage({ type: 'success', message: 'Class updated successfully!' })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to update class. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleEnrollStudent = async (studentId: string, enrolled: boolean) => {
    if (!selectedClass) return

    try {
      if (enrolled) {
        await actions.enrollStudent(selectedClass.id, studentId)
        setStatusMessage({ type: 'success', message: 'Student enrolled successfully!' })
      } else {
        await actions.unenrollStudent(selectedClass.id, studentId)
        setStatusMessage({ type: 'success', message: 'Student unenrolled successfully!' })
      }
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to update enrollment. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return

    actions.addSchedule({
      classId: selectedClass.id,
      dayOfWeek: parseInt(scheduleFormData.dayOfWeek, 10),
      startTime: scheduleFormData.startTime,
      endTime: scheduleFormData.endTime
    })
    setScheduleFormData({ dayOfWeek: "", startTime: "", endTime: "" })
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await actions.deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handleDeleteClick = async (classItem: Class, e: React.MouseEvent) => {
    e.stopPropagation()
    setClassToDelete(classItem)
    setIsCalculatingImpact(true)
    setDeleteDialogOpen(true)
    
    const calculateImpact = async () => {
      const impact = await calculateClassDeletionImpact(classItem.id)
      setDeletionImpact(impact)
    }
    
    try {
      await retryOperation(
        calculateImpact,
        DEFAULT_RETRY_CONFIG,
        (attempt, error) => {
          setRetryCount(attempt)
          console.log(`Impact calculation attempt ${attempt} failed:`, error)
          toast.loading(`Calculating deletion impact... (attempt ${attempt})`, {
            duration: 2000
          })
        }
      )
    } catch (error) {
      handleImpactCalculationError(
        error, 
        'class', 
        classItem.name,
        () => handleDeleteClick(classItem, e)
      )
      setDeleteDialogOpen(false)
      setClassToDelete(null)
    } finally {
      setIsCalculatingImpact(false)
      setRetryCount(0)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!classToDelete) return
    
    setIsDeleting(true)
    
    const performDelete = async () => {
      await actions.deleteClass(classToDelete.id)
    }
    
    try {
      await retryOperation(
        performDelete,
        DEFAULT_RETRY_CONFIG,
        (attempt, error) => {
          setRetryCount(attempt)
          console.log(`Delete attempt ${attempt} failed:`, error)
          toast.loading(`Deleting class... (attempt ${attempt})`, {
            duration: 2000
          })
        }
      )
      
      // Success feedback
      handleDeleteSuccess('class', classToDelete.name)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      const deletedClassName = classToDelete.name
      setClassToDelete(null)
      setDeletionImpact(null)
      
      // Also show status message for consistency with existing UI
      setStatusMessage({ 
        type: 'success', 
        message: `Class "${deletedClassName}" deleted successfully!` 
      })
      setTimeout(() => setStatusMessage(null), 3000)
      
    } catch (error) {
      // Enhanced error handling with retry option
      handleDeleteError(
        error, 
        'class', 
        classToDelete.name,
        () => handleDeleteConfirm()
      )
      
      // Also show status message for consistency with existing UI
      setStatusMessage({ 
        type: 'error', 
        message: 'Failed to delete class. Please check the error message and try again.' 
      })
      setTimeout(() => setStatusMessage(null), 8000) // Longer duration for error messages
      
    } finally {
      setIsDeleting(false)
      setRetryCount(0)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setClassToDelete(null)
    setDeletionImpact(null)
  }

  const getScheduleForClass = (classId: string) => {
    return data.schedules.filter(schedule => schedule.classId === classId)
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  const getEnrolledStudents = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return []
    return data.students.filter(student => classItem.enrolledStudents.includes(student.id))
  }

  const getAvailableStudents = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return data.students
    return data.students.filter(student => !classItem.enrolledStudents.includes(student.id))
  }

  // Show loading state during initial load
  if (isInitialLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">Loading your classes...</p>
          </div>
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

        {/* Loading skeleton for classes */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-4 pt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Show error state if there are critical errors
  const hasErrors = Object.keys(errors || {}).length > 0
  if (hasErrors) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">Manage your classes and enrollments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There was an error loading your classes. Please try refreshing the page.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => actions.refreshData?.()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-md ${
          statusMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            {statusMessage.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            Manage your classes and enrollments
          </p>
        </div>
        {loading?.classes && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Add Class">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Add Class</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Advanced Biology"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Language Arts">Language Arts</SelectItem>
                    <SelectItem value="Social Studies">Social Studies</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Physical Education">Physical Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the class"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Science 101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Maximum number of students"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Class Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {classColors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      className={`w-8 h-8 rounded-lg border-2 ${formData.color === colorOption.value ? 'border-foreground' : 'border-border'
                        }`}
                      style={{ backgroundColor: colorOption.value }}
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Create Class</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manage Class Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage Class: {selectedClass?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedClass && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="students" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Schedule
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Class Name</Label>
                        <Input
                          id="edit-name"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-subject">Subject</Label>
                        <Select value={editFormData.subject} onValueChange={(value) => setEditFormData({ ...editFormData, subject: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="Language Arts">Language Arts</SelectItem>
                            <SelectItem value="Social Studies">Social Studies</SelectItem>
                            <SelectItem value="Arts">Arts</SelectItem>
                            <SelectItem value="Physical Education">Physical Education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-room">Room</Label>
                        <Input
                          id="edit-room"
                          value={editFormData.room}
                          onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-capacity">Capacity</Label>
                        <Input
                          id="edit-capacity"
                          type="number"
                          value={editFormData.capacity}
                          onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-color">Class Color</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {classColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            type="button"
                            className={`w-8 h-8 rounded-lg border-2 ${editFormData.color === colorOption.value ? 'border-foreground' : 'border-border'
                              }`}
                            style={{ backgroundColor: colorOption.value }}
                            onClick={() => setEditFormData({ ...editFormData, color: colorOption.value })}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Save Changes</Button>
                      <Button type="button" variant="outline" onClick={() => setIsManageDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Enrolled Students ({selectedClass.enrolledStudents.length}/{selectedClass.capacity})</h4>
                      {getEnrolledStudents(selectedClass.id).length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {getEnrolledStudents(selectedClass.id).map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-muted-foreground">{student.email} • {student.grade}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnrollStudent(student.id, false)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No students enrolled yet</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Available Students</h4>
                      {getAvailableStudents(selectedClass.id).length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {getAvailableStudents(selectedClass.id).map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-muted-foreground">{student.email} • {student.grade}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnrollStudent(student.id, true)}
                                disabled={selectedClass.enrolledStudents.length >= selectedClass.capacity}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Enroll
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">All students are enrolled</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Current Schedule</h4>
                      {getScheduleForClass(selectedClass.id).length > 0 ? (
                        <div className="space-y-2">
                          {getScheduleForClass(selectedClass.id).map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium">{getDayName(schedule.dayOfWeek)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No schedule set for this class</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Add Schedule</h4>
                      <form onSubmit={handleAddSchedule} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="schedule-day">Day</Label>
                            <Select value={scheduleFormData.dayOfWeek} onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, dayOfWeek: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Monday</SelectItem>
                                <SelectItem value="2">Tuesday</SelectItem>
                                <SelectItem value="3">Wednesday</SelectItem>
                                <SelectItem value="4">Thursday</SelectItem>
                                <SelectItem value="5">Friday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="schedule-start">Start Time</Label>
                            <Input
                              id="schedule-start"
                              type="time"
                              value={scheduleFormData.startTime}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="schedule-end">End Time</Label>
                            <Input
                              id="schedule-end"
                              type="time"
                              value={scheduleFormData.endTime}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm">Add Schedule</Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {data.classes.map((classItem) => {
          const schedules = getScheduleForClass(classItem.id)
          return (
            <Card
              key={classItem.id}
              className="relative cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
              onClick={() => navigate(`/classes/${classItem.id}`)}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                style={{ backgroundColor: classItem.color }}
              />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: classItem.color }}
                    />
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{classItem.subject}</Badge>
                </div>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{classItem.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classItem.enrolledStudents.length}/{classItem.capacity} students</span>
                  </div>
                  {schedules.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Schedule:</span>
                      </div>
                      <div className="space-y-1 ml-6">
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="text-sm">
                            {getDayName(schedule.dayOfWeek)} {schedule.startTime} - {schedule.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/classes/${classItem.id}`)
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleManageClass(classItem)
                    }}
                    title="Manage class"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDeleteClick(classItem, e)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30"
                    title="Delete class"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Class"
        description={
          isCalculatingImpact 
            ? "Calculating impact of deletion..." 
            : "Are you sure you want to delete this class? This action cannot be undone."
        }
        itemName={classToDelete?.name || ''}
        impactInfo={deletionImpact || undefined}
        isLoading={isDeleting}
        isRetrying={retryCount > 0}
        retryCount={retryCount}
        maxRetries={DEFAULT_RETRY_CONFIG.maxAttempts}
        itemType="class"
        isCalculatingImpact={isCalculatingImpact}
        networkStatus={networkStatus.status}
      />
    </div>
  )
}