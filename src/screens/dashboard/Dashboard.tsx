import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, GraduationCap, Calendar, Clock, MapPin, CalendarCheck, UserCheck } from "lucide-react"
import { classColors } from "@/data/mockData"
import { useAppData } from "@/context/AppDataContext"

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, actions } = useAppData()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [classFormData, setClassFormData] = useState({
    name: "",
    subject: "",
    description: "",
    room: "",
    capacity: "",
    color: "#3b82f6"
  })
  const [studentFormData, setStudentFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    parentContact: ""
  })
  const [scheduleFormData, setScheduleFormData] = useState({
    classId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: ""
  })
  const [meetingFormData, setMeetingFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    participants: [] as string[],
    participantType: "students" as "students" | "parents" | "teachers",
    location: "",
    meetingType: "in-person" as "in-person" | "virtual"
  })

  const totalStudents = data.students.length
  const totalClasses = data.classes.length
  const todayClasses = data.schedules.filter(schedule => {
    const today = new Date().getDay()
    return schedule.dayOfWeek === today
  }).length


  const totalMeetings = data.meetings.length
  const upcomingMeetings = data.meetings.filter(meeting => 
    meeting.status === "scheduled" && new Date(meeting.date) >= new Date()
  ).length



  const recentClasses = data.classes.slice(0, 4)

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addClass({
      name: classFormData.name,
      subject: classFormData.subject,
      description: classFormData.description,
      room: classFormData.room,
      capacity: classFormData.capacity,
      color: classFormData.color
    })
    setClassFormData({ name: "", subject: "", description: "", room: "", capacity: "", color: "#3b82f6" })
    setActiveModal(null)
  }

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addStudent({
      name: studentFormData.name,
      email: studentFormData.email,
      phone: studentFormData.phone,
      grade: studentFormData.grade,
      parentContact: studentFormData.parentContact
    })
    setStudentFormData({ name: "", email: "", phone: "", grade: "", parentContact: "" })
    setActiveModal(null)
  }

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addSchedule({
      classId: scheduleFormData.classId,
      dayOfWeek: scheduleFormData.dayOfWeek,
      startTime: scheduleFormData.startTime,
      endTime: scheduleFormData.endTime
    })
    setScheduleFormData({ classId: "", dayOfWeek: "", startTime: "", endTime: "" })
    setActiveModal(null)
  }

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addMeeting({
      title: meetingFormData.title,
      description: meetingFormData.description,
      date: meetingFormData.date,
      startTime: meetingFormData.startTime,
      endTime: meetingFormData.endTime,
      participants: meetingFormData.participants,
      participantType: meetingFormData.participantType,
      location: meetingFormData.location,
      meetingType: meetingFormData.meetingType,
      status: "scheduled"
    })
    setMeetingFormData({
      title: "", description: "", date: "", startTime: "", endTime: "",
      participants: [], participantType: "students", location: "", meetingType: "in-person"
    })
    setActiveModal(null)
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  const todaySchedule = data.schedules
    .filter(schedule => schedule.dayOfWeek === new Date().getDay())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map(schedule => {
      const classData = data.classes.find(c => c.id === schedule.classId)
      return { ...schedule, classData }
    })

  const quickActions = [
    {
      icon: GraduationCap,
      label: "Create new class",
      action: () => setActiveModal("create-class")
    },
    {
      icon: Users,
      label: "Add new student", 
      action: () => setActiveModal("add-student")
    },
    {
      icon: Calendar,
      label: "Schedule class time",
      action: () => setActiveModal("schedule-class")
    },
    {
      icon: UserCheck,
      label: "Take attendance",
      action: () => navigate("/attendance")
    },
    {
      icon: CalendarCheck,
      label: "Schedule meeting",
      action: () => setActiveModal("schedule-meeting")
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your classroom management system</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/calendar')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/meetings')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingMeetings} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Classes */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
            <CardDescription>
              Your recently created or updated classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClasses.map((classItem) => (
                <div 
                  key={classItem.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/classes/${classItem.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: classItem.color }}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {classItem.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.subject} • {classItem.enrolledStudents.length} students
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{classItem.room}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2"
                  onClick={action.action}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={activeModal === "create-class"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="create-class-description">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription id="create-class-description">
              Add a new class to your curriculum.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClassSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                value={classFormData.name}
                onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                placeholder="e.g., Advanced Biology"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-subject">Subject</Label>
              <Select value={classFormData.subject} onValueChange={(value) => setClassFormData({ ...classFormData, subject: value })}>
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
              <Label htmlFor="class-description">Description</Label>
              <Textarea
                id="class-description"
                value={classFormData.description}
                onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                placeholder="Brief description of the class"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-room">Room</Label>
              <Input
                id="class-room"
                value={classFormData.room}
                onChange={(e) => setClassFormData({ ...classFormData, room: e.target.value })}
                placeholder="e.g., Science 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-capacity">Capacity</Label>
              <Input
                id="class-capacity"
                type="number"
                value={classFormData.capacity}
                onChange={(e) => setClassFormData({ ...classFormData, capacity: e.target.value })}
                placeholder="Maximum number of students"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-color">Class Color</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {classColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 ${
                      classFormData.color === colorOption.value ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setClassFormData({ ...classFormData, color: colorOption.value })}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Create Class</Button>
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "add-student"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="add-student-description">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription id="add-student-description">
              Add a new student to your roster.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                value={studentFormData.name}
                onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={studentFormData.email}
                onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                placeholder="student@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone</Label>
              <Input
                id="student-phone"
                value={studentFormData.phone}
                onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-grade">Grade</Label>
              <Select value={studentFormData.grade} onValueChange={(value) => setStudentFormData({ ...studentFormData, grade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9th Grade">9th Grade</SelectItem>
                  <SelectItem value="10th Grade">10th Grade</SelectItem>
                  <SelectItem value="11th Grade">11th Grade</SelectItem>
                  <SelectItem value="12th Grade">12th Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-parent">Parent Contact</Label>
              <Input
                id="student-parent"
                value={studentFormData.parentContact}
                onChange={(e) => setStudentFormData({ ...studentFormData, parentContact: e.target.value })}
                placeholder="(555) 123-4568"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Add Student</Button>
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "schedule-class"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="schedule-class-description">
          <DialogHeader>
            <DialogTitle>Schedule Class Time</DialogTitle>
            <DialogDescription id="schedule-class-description">
              Create a new schedule for an existing class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-class">Class</Label>
              <Select value={scheduleFormData.classId} onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {data.classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-day">Day of Week</Label>
              <Select value={scheduleFormData.dayOfWeek} onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, dayOfWeek: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Create Schedule</Button>
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "view-schedule"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="view-schedule-description">
          <DialogHeader>
            <DialogTitle>Today's Schedule</DialogTitle>
            <DialogDescription id="view-schedule-description">
              Overview of all classes scheduled for today
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{schedule.classData?.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {schedule.classData?.room}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.classData?.subject} • {schedule.classData?.enrolledStudents.length} students
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {getDayName(schedule.dayOfWeek)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No classes scheduled for today
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "schedule-meeting"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="schedule-meeting-description">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription id="schedule-meeting-description">
              Create a new meeting with students, parents, or colleagues.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMeetingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                value={meetingFormData.title}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, title: e.target.value })}
                placeholder="e.g., Parent-Teacher Conference"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                value={meetingFormData.description}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, description: e.target.value })}
                placeholder="Brief description of the meeting purpose"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingFormData.date}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-start">Start</Label>
                <Input
                  id="meeting-start"
                  type="time"
                  value={meetingFormData.startTime}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-end">End</Label>
                <Input
                  id="meeting-end"
                  type="time"
                  value={meetingFormData.endTime}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-type">Meeting Type</Label>
              <Select value={meetingFormData.meetingType} onValueChange={(value: "in-person" | "virtual") => setMeetingFormData({ ...meetingFormData, meetingType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-location">Location</Label>
              <Input
                id="meeting-location"
                value={meetingFormData.location}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, location: e.target.value })}
                placeholder={meetingFormData.meetingType === "virtual" ? "Meeting link" : "Room location"}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Schedule Meeting</Button>
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}