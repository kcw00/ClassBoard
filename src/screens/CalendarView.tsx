import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, ExternalLink, GripVertical } from "lucide-react"
import { useAppData } from "@/context/AppDataContext"
import { toast } from "sonner"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  type: 'class' | 'meeting' | 'event' | 'test'
  classId?: string
  meetingId?: string
  testId?: string
  location?: string
  participants?: string[]
  status?: string
}

export default function CalendarView() {
  const { data, actions } = useAppData()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isEventDetailDialogOpen, setIsEventDetailDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [pendingDrop, setPendingDrop] = useState<{ event: CalendarEvent, date: string, time: string } | null>(null)
  const [isClassChangeDialogOpen, setIsClassChangeDialogOpen] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    type: 'event' as const,
    classId: '',
    location: ''
  })

  // Time slots configuration (7 AM to 10 PM)
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      display: hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
    }
  })

  // Helper functions
  const calculateDurationMinutes = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    return endTotalMinutes - startTotalMinutes
  }

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Helper function to calculate duration between two times
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`1970-01-01T${startTime}:00`)
    const end = new Date(`1970-01-01T${endTime}:00`)
    return (end.getTime() - start.getTime()) / (1000 * 60) // Return minutes
  }

  // Generate calendar events from schedules, meetings, and tests
  const getCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    // Add class schedules as recurring events for the current week
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Add scheduled classes, checking for exceptions first
      data.schedules.forEach(schedule => {
        if (schedule.dayOfWeek === date.getDay()) {
          const classItem = data.classes.find(c => c.id === schedule.classId)
          if (classItem) {
            // Check if there's an exception for this specific date
            const exception = data.scheduleExceptions.find(ex =>
              ex.scheduleId === schedule.id && ex.date === dateStr
            )

            if (exception) {
              // If cancelled, don't add the event
              if (exception.cancelled) {
                return
              }
              // Use exception time instead of regular schedule
              const duration = calculateDurationMinutes(exception.startTime, exception.endTime)
              events.push({
                id: `schedule-${schedule.id}-${dateStr}`,
                title: classItem.name,
                description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students (Rescheduled)`,
                date: dateStr,
                time: exception.startTime,
                duration: duration,
                type: 'class',
                classId: schedule.classId
              })
            } else {
              // Use regular schedule
              const duration = calculateDurationMinutes(schedule.startTime, schedule.endTime)
              events.push({
                id: `schedule-${schedule.id}-${dateStr}`,
                title: classItem.name,
                description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students`,
                date: dateStr,
                time: schedule.startTime,
                duration: duration,
                type: 'class',
                classId: classItem.id,
                location: classItem.room
              })
            }
          }
        }
      })

      // Add schedule exceptions that move classes TO this date (regardless of original day)
      data.scheduleExceptions.forEach(exception => {
        if (exception.date === dateStr && !exception.cancelled) {
          const schedule = data.schedules.find(s => s.id === exception.scheduleId)
          if (schedule) {
            const classItem = data.classes.find(c => c.id === schedule.classId)
            if (classItem) {
              // Make sure we haven't already added this exception in the regular schedule loop
              const alreadyAdded = events.some(event =>
                event.id === `schedule-${schedule.id}-${dateStr}`
              )
              if (!alreadyAdded) {
                const duration = calculateDurationMinutes(exception.startTime, exception.endTime)
                events.push({
                  id: `schedule-${schedule.id}-${dateStr}`,
                  title: classItem.name,
                  description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students (Moved from ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]
                    })`,
                  date: dateStr,
                  time: exception.startTime,
                  duration: duration,
                  type: 'class',
                  classId: classItem.id,
                  location: classItem.room
                })
              }
            }
          }
        }
      })
    }

    // Add meetings
    data.meetings.forEach(meeting => {
      events.push({
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        time: meeting.startTime,
        duration: calculateDuration(meeting.startTime, meeting.endTime),
        type: 'meeting',
        meetingId: meeting.id,
        location: meeting.location,
        participants: meeting.participants,
        status: meeting.status
      })
    })

    // Add tests that fall within the current week
    data.tests.forEach(test => {
      const testDate = new Date(test.testDate)
      const weekStart = new Date(startOfWeek)
      const weekEnd = new Date(startOfWeek)
      weekEnd.setDate(weekStart.getDate() + 6)

      if (testDate >= weekStart && testDate <= weekEnd) {
        const classItem = data.classes.find(c => c.id === test.classId)
        events.push({
          id: `test-${test.id}`,
          title: `Test: ${test.title}`,
          description: `${test.testType} for ${classItem?.name || 'Unknown Class'}`,
          date: test.testDate,
          time: '09:00', // Default time if not specified
          duration: 90, // Default duration for tests
          type: 'test',
          testId: test.id,
          classId: test.classId,
          location: classItem?.room || 'Classroom'
        })
      }
    })

    return events.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })
  }

  const events = getCalendarEvents()

  // Generate events for today specifically (independent of week navigation)
  const getTodayEvents = (): CalendarEvent[] => {
    const todayEvents: CalendarEvent[] = []
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const todayDayOfWeek = today.getDay()

    // Add scheduled classes for today, checking for exceptions
    data.schedules.forEach(schedule => {
      if (schedule.dayOfWeek === todayDayOfWeek) {
        const classItem = data.classes.find(c => c.id === schedule.classId)
        if (classItem) {
          // Check if there's an exception for today
          const exception = data.scheduleExceptions.find(ex =>
            ex.scheduleId === schedule.id && ex.date === todayStr
          )

          if (exception) {
            // If cancelled, don't add the event
            if (exception.cancelled) {
              return
            }
            // Use exception time instead of regular schedule
            const duration = calculateDurationMinutes(exception.startTime, exception.endTime)
            todayEvents.push({
              id: `schedule-${schedule.id}-${todayStr}`,
              title: classItem.name,
              description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students (Rescheduled)`,
              date: todayStr,
              time: exception.startTime,
              duration: duration,
              type: 'class',
              classId: classItem.id,
              location: classItem.room
            })
          } else {
            // Use regular schedule
            todayEvents.push({
              id: `schedule-${schedule.id}-${todayStr}`,
              title: classItem.name,
              description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students`,
              date: todayStr,
              time: schedule.startTime,
              duration: calculateDuration(schedule.startTime, schedule.endTime),
              type: 'class',
              classId: classItem.id,
              location: classItem.room
            })
          }
        }
      }
    })

    // Add schedule exceptions that move classes TO today (regardless of original day)
    data.scheduleExceptions.forEach(exception => {
      if (exception.date === todayStr && !exception.cancelled) {
        const schedule = data.schedules.find(s => s.id === exception.scheduleId)
        if (schedule) {
          const classItem = data.classes.find(c => c.id === schedule.classId)
          if (classItem) {
            // Make sure we haven't already added this exception in the regular schedule loop
            const alreadyAdded = todayEvents.some(event =>
              event.id === `schedule-${schedule.id}-${todayStr}`
            )
            if (!alreadyAdded) {
              const duration = calculateDurationMinutes(exception.startTime, exception.endTime)
              todayEvents.push({
                id: `schedule-${schedule.id}-${todayStr}`,
                title: classItem.name,
                description: `${classItem.subject} class with ${classItem.enrolledStudents.length} students (Moved from ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]
                  })`,
                date: todayStr,
                time: exception.startTime,
                duration: duration,
                type: 'class',
                classId: classItem.id,
                location: classItem.room
              })
            }
          }
        }
      }
    })

    // Add meetings for today
    data.meetings.forEach(meeting => {
      if (meeting.date === todayStr) {
        todayEvents.push({
          id: `meeting-${meeting.id}`,
          title: meeting.title,
          description: meeting.description,
          date: meeting.date,
          time: meeting.startTime,
          duration: calculateDuration(meeting.startTime, meeting.endTime),
          type: 'meeting',
          meetingId: meeting.id,
          location: meeting.location,
          participants: meeting.participants,
          status: meeting.status
        })
      }
    })

    // Add tests for today
    data.tests.forEach(test => {
      if (test.testDate === todayStr) {
        const classItem = data.classes.find(c => c.id === test.classId)
        todayEvents.push({
          id: `test-${test.id}`,
          title: `Test: ${test.title}`,
          description: `${test.testType} for ${classItem?.name || 'Unknown Class'}`,
          date: test.testDate,
          time: '09:00', // Default time if not specified
          duration: 90, // Default duration for tests
          type: 'test',
          testId: test.id,
          classId: test.classId,
          location: classItem?.room || 'Classroom'
        })
      }
    })

    return todayEvents.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })
  }

  const todayEvents = getTodayEvents()

  // Get current week dates
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault()
    if (!draggedEvent) return

    // Check if the drop is to the same date and time (no change needed)
    if (draggedEvent.date === date && draggedEvent.time === time) {
      setDraggedEvent(null)
      return
    }

    // For class items, ask user for confirmation
    if (draggedEvent.type === 'class') {
      setPendingDrop({ event: draggedEvent, date, time })
      setIsClassChangeDialogOpen(true)
      setDraggedEvent(null)
      return
    }

    // For meeting items, apply changes directly
    if (draggedEvent.type === 'meeting' && draggedEvent.meetingId) {
      const newStartTime = time
      const originalMeeting = data.meetings.find(m => m.id === draggedEvent.meetingId)

      if (originalMeeting) {
        // Calculate end time based on original duration
        const originalStart = originalMeeting.startTime
        const originalEnd = originalMeeting.endTime
        const startHour = parseInt(originalStart.split(':')[0])
        const startMinute = parseInt(originalStart.split(':')[1])
        const endHour = parseInt(originalEnd.split(':')[0])
        const endMinute = parseInt(originalEnd.split(':')[1])
        const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)

        const newStartHour = parseInt(newStartTime.split(':')[0])
        const newStartMinute = parseInt(newStartTime.split(':')[1] || '0')
        const newEndTotalMinutes = (newStartHour * 60 + newStartMinute) + durationMinutes
        const newEndHour = Math.floor(newEndTotalMinutes / 60)
        const newEndMinute = newEndTotalMinutes % 60
        const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`

        actions.updateMeeting(draggedEvent.meetingId, {
          date: date,
          startTime: newStartTime,
          endTime: newEndTime
        })

        const dateFormatted = new Date(date).toLocaleDateString()
        toast.success(`Meeting "${draggedEvent.title}" moved to ${dateFormatted} at ${newStartTime}`)
      }
    }

    // For other event types, apply changes if applicable
    if (draggedEvent.type === 'test' && draggedEvent.testId) {
      actions.updateTest(draggedEvent.testId, {
        testDate: date
      })
      const dateFormatted = new Date(date).toLocaleDateString()
      toast.success(`Test "${draggedEvent.title}" moved to ${dateFormatted}`)
    }

    setDraggedEvent(null)
  }

  // Handle class schedule change confirmation
  const handleClassScheduleChange = (changeType: 'today' | 'recurring') => {
    if (!pendingDrop) return

    const { event, date, time } = pendingDrop

    if (changeType === 'today') {
      // Create a one-time schedule exception for this specific date
      if (event.type === 'class') {
        const scheduleId = event.id.replace('schedule-', '').split('-')[0]
        const endTime = calculateEndTime(time, event.duration)

        try {
          // Check if there's already an exception for this date
          const existingException = data.scheduleExceptions.find(ex =>
            ex.scheduleId === scheduleId && ex.date === date
          )

          if (existingException) {
            // Update existing exception
            actions.updateScheduleException(existingException.id, {
              startTime: time,
              endTime: endTime,
              cancelled: false
            })
            toast.success(`Class "${event.title}" moved to ${time} for ${new Date(date).toLocaleDateString()} only`)
          } else {
            // Create new exception
            actions.addScheduleException({
              scheduleId: scheduleId,
              date: date,
              startTime: time,
              endTime: endTime
            })
            toast.success(`Class "${event.title}" moved to ${time} for ${new Date(date).toLocaleDateString()} only`)
          }
        } catch (error) {
          toast.error('Failed to create schedule exception')
          console.error('Error creating schedule exception:', error)
        }
      }
    } else if (changeType === 'recurring') {
      // Update the recurring schedule
      if (event.type === 'class') {
        const scheduleId = event.id.replace('schedule-', '').split('-')[0]
        const targetDate = new Date(date)
        const dayOfWeek = targetDate.getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

        try {
          actions.updateSchedule(scheduleId, {
            dayOfWeek: dayOfWeek,
            startTime: time,
            // Keep the same duration by calculating end time
            endTime: calculateEndTime(time, event.duration)
          })

          toast.success(`Class "${event.title}" schedule updated to ${dayNames[dayOfWeek]}s at ${time}`)
        } catch (error) {
          toast.error('Failed to update class schedule')
          console.error('Error updating schedule:', error)
        }
      }
    }

    setPendingDrop(null)
    setIsClassChangeDialogOpen(false)
  }



  // Get the time slot index for an event
  const getTimeSlotIndex = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    return Math.max(0, hour - 7) // 7 AM is index 0
  }

  // Calculate event height and position based on duration and time
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = parseInt(event.time.split(':')[0])
    const startMinute = parseInt(event.time.split(':')[1] || '0')

    // Calculate position from 7 AM
    const topOffset = ((startHour - 7) * 40) + (startMinute * 40 / 60)
    const height = Math.max((event.duration * 40) / 60, 20) // Minimum 20px height

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      zIndex: 10
    }
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  // Handle scroll to update visible time slots
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Calculate which time slots to show based on scroll position
  const getVisibleTimeSlots = () => {
    const containerHeight = 336 // Height of the time column visible area
    const slotHeight = 40 // Height of each time slot
    const scrollOffset = Math.floor(scrollTop / slotHeight)
    const visibleSlotCount = Math.ceil(containerHeight / slotHeight) + 1

    const startIndex = Math.max(0, scrollOffset)
    const endIndex = Math.min(timeSlots.length, startIndex + visibleSlotCount)

    return timeSlots.slice(startIndex, endIndex).map((slot, index) => ({
      ...slot,
      position: (startIndex + index) * slotHeight - scrollTop
    }))
  }

  // Check if today falls within the currently selected week
  const isTodayInCurrentWeek = () => {
    const today = new Date()
    const todayStr = today.toDateString()

    return weekDates.some(date => date.toDateString() === todayStr)
  }

  // Event type styling - now supports individual class colors
  const getEventTypeColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'class':
        if (event.classId) {
          const classItem = data.classes.find(c => c.id === event.classId)
          if (classItem?.color) {
            // Use the class's specific color
            return `border-2` // We'll use inline styles for the background color
          }
        }
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'meeting':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'test':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'event':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get class color styling
  const getClassColorStyle = (event: CalendarEvent) => {
    if (event.type === 'class' && event.classId) {
      const classItem = data.classes.find(c => c.id === event.classId)
      if (classItem?.color) {
        // Convert hex color to rgba for background and border
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        return {
          backgroundColor: hexToRgba(classItem.color, 0.1),
          borderColor: hexToRgba(classItem.color, 0.3),
          color: classItem.color
        }
      }
    }
    return {}
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDetailDialogOpen(true)
  }

  // Handle view details navigation
  const handleViewDetails = () => {
    if (!selectedEvent) return

    switch (selectedEvent.type) {
      case 'class':
        navigate(`/classes/${selectedEvent.classId}`)
        break
      case 'meeting':
        navigate('/meetings')
        break
      case 'test':
        navigate(`/tests/${selectedEvent.testId}`)
        break
      default:
        break
    }
    setIsEventDetailDialogOpen(false)
  }

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would add to the context/database
    console.log('Adding event:', newEvent)
    setIsEventDialogOpen(false)
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 60,
      type: 'event',
      classId: '',
      location: ''
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Add Event">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Add Event</span>
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="add-event-description">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription id="add-event-description">Create a new event for your calendar</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                    min="15"
                    max="480"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground min-w-[60px]">
                      {event.time}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`md:hidden ${getEventTypeColor(event)}`}
                      style={getClassColorStyle(event)}
                    >
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.description}</div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`hidden md:block ${getEventTypeColor(event)}`}
                    style={getClassColorStyle(event)}
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription className="hidden sm:block">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {' - '}
              Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </CardDescription>
          </div>
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-96 max-h-96 overflow-x-auto">
            {/* Dynamic Time Labels Column */}
            <div className="w-12 md:w-16 border-r bg-gray-50/50 flex flex-col flex-shrink-0">
              {/* Empty space for day headers */}
              <div className="h-12 bg-gray-50/30 border-b"></div>

              {/* Dynamic time slots that update based on scroll */}
              <div className="relative overflow-hidden" style={{ height: '336px' }}>
                {/* Time labels that correspond to scroll position */}
                {getVisibleTimeSlots().map((slot, index) => (
                  <div
                    key={`${slot.time}-${index}`}
                    className="absolute w-full flex justify-center text-xs text-muted-foreground"
                    style={{
                      top: `${slot.position + 14}px`, // Position based on scroll
                      height: '12px'
                    }}
                  >
                    {slot.display}
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable Days Grid */}
            <div className="flex-1 overflow-y-auto overflow-x-auto" onScroll={handleScroll}>
              <div className="grid grid-cols-7 min-w-max md:min-w-full">
                {weekDates.map((date, dayIndex) => {
                  const dayEvents = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const dateStr = date.toISOString().split('T')[0]

                  return (
                    <div key={dayIndex} className="border-r last:border-r-0 flex flex-col min-w-[100px] md:min-w-[120px]">
                      {/* Fixed Day Header */}
                      <div className="h-12 border-b flex flex-col items-center justify-center bg-gray-50/30 sticky top-0 z-20">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {dayNames[dayIndex].substring(0, 3)}
                        </div>
                        <div className={`text-sm font-semibold ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs' : ''
                          }`}>
                          {date.getDate()}
                        </div>
                      </div>

                      {/* Day Column with Events - Full height for all time slots */}
                      <div className="relative" style={{ height: '640px' }}>
                        {/* Time slot backgrounds */}
                        {timeSlots.map((_, timeIndex) => (
                          <div
                            key={timeIndex}
                            className="absolute left-0 right-0 border-b hover:bg-blue-50/30 transition-colors"
                            style={{
                              top: `${timeIndex * 40}px`,
                              height: '40px'
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dateStr, timeSlots[timeIndex].time)}
                          />
                        ))}

                        {/* Events positioned absolutely */}
                        {dayEvents.map((event) => {
                          const startHour = parseInt(event.time.split(':')[0])
                          const startMinute = parseInt(event.time.split(':')[1] || '0')
                          const topOffset = ((startHour - 7) * 40) + (startMinute * 40 / 60)
                          const height = Math.max((event.duration * 40) / 60, 20)

                          return (
                            <div
                              key={event.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, event)}
                              className={`absolute left-1 right-1 rounded-sm p-1 text-xs cursor-pointer border-l-4 shadow-sm hover:shadow-md transition-all ${draggedEvent?.id === event.id ? 'opacity-50' : ''
                                }`}
                              style={{
                                top: `${topOffset}px`,
                                height: `${height}px`,
                                zIndex: 10,
                                ...getClassColorStyle(event),
                                backgroundColor: event.type === 'class' ?
                                  (data.classes.find(c => c.id === event.classId)?.color + '20' || '#3b82f620') :
                                  event.type === 'meeting' ? '#6b728020' :
                                    event.type === 'test' ? '#dc262620' : '#8b5cf620',
                                borderLeftColor: event.type === 'class' ?
                                  (data.classes.find(c => c.id === event.classId)?.color || '#3b82f6') :
                                  event.type === 'meeting' ? '#6b7280' :
                                    event.type === 'test' ? '#dc2626' : '#8b5cf6'
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              <div className="font-medium text-gray-900 leading-tight text-xs">
                                {event.time} {event.title}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <Dialog open={isEventDetailDialogOpen} onOpenChange={setIsEventDetailDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="event-detail-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.type === 'class' && <Users className="h-5 w-5 text-blue-600" />}
              {selectedEvent?.type === 'meeting' && <Calendar className="h-5 w-5 text-green-600" />}
              {selectedEvent?.type === 'test' && <Clock className="h-5 w-5 text-red-600" />}
              {selectedEvent?.type === 'event' && <Calendar className="h-5 w-5 text-purple-600" />}
              {selectedEvent?.title || 'Event Details'}
            </DialogTitle>
            <DialogDescription id="event-detail-description">
              {selectedEvent?.description || 'View event information and details'}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium">{selectedEvent.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">{selectedEvent.duration} minutes</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <Badge
                    className={getEventTypeColor(selectedEvent)}
                    style={getClassColorStyle(selectedEvent)}
                  >
                    {selectedEvent.type}
                  </Badge>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Participants:</span>
                  <p className="font-medium">{selectedEvent.participants.length} participants</p>
                </div>
              )}

              {selectedEvent.status && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedEvent.status}
                  </Badge>
                </div>
              )}

              {/* Additional details based on event type */}
              {selectedEvent.type === 'class' && selectedEvent.classId && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Students Enrolled:</span>
                  <p className="font-medium">
                    {data.classes.find(c => c.id === selectedEvent.classId)?.enrolledStudents.length || 0}
                  </p>
                </div>
              )}

              {selectedEvent.type === 'test' && selectedEvent.testId && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Test Type:</span>
                  <p className="font-medium">
                    {data.tests.find(t => t.id === selectedEvent.testId)?.testType || 'Unknown'}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEventDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedEvent && (selectedEvent.classId || selectedEvent.testId || selectedEvent.meetingId) && (
              <Button onClick={handleViewDetails}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Schedule Change Confirmation Dialog */}
      <AlertDialog open={isClassChangeDialogOpen} onOpenChange={setIsClassChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Class Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              You're moving "{pendingDrop?.event.title}" to {pendingDrop && new Date(pendingDrop.date).toLocaleDateString()} at {pendingDrop?.time}.
              <br /><br />
              How would you like to apply this change?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingDrop(null)
                setIsClassChangeDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleClassScheduleChange('today')}
            >
              Just for Today
            </Button>
            <Button
              onClick={() => handleClassScheduleChange('recurring')}
            >
              Change Recurring Schedule
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}