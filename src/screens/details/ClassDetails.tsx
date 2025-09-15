import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Users, MapPin, Clock, Calendar, FileText, Plus, Edit2, Trash2, UserPlus, UserMinus, BarChart3, TrendingUp } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAppData } from "@/context/AppDataMigrationContext"
import type { ClassNote, Schedule, Student } from "@/types"


export default function ClassDetails() {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const { data, actions } = useAppData()
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isNotesListDialogOpen, setIsNotesListDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false)
  const [isStudentManagementDialogOpen, setIsStudentManagementDialogOpen] = useState(false)
  const [isAttendanceStatsDialogOpen, setIsAttendanceStatsDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<ClassNote | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [noteFormData, setNoteFormData] = useState({
    content: "",
    topics: "",
    homework: "",
    objectives: ""
  })
  const [selectedDate, setSelectedDate] = useState("")
  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: ""
  })
  const [studentFormData, setStudentFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    parentContact: ""
  })

  const classData = (data.classes || []).find(c => c.id === classId)

  if (!classData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/classes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Class not found</p>
        </div>
      </div>
    )
  }

  const enrolledStudents = (data.students || []).filter(student =>
    (classData?.enrolledStudents || []).includes(student.id)
  )

  const classSchedules = (data.schedules || []).filter(schedule =>
    schedule.classId === classId
  )

  const classNotes = (data.classNotes || []).filter(note =>
    note.classId === classId
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const attendanceRecords = (data.attendanceRecords || []).filter(record =>
    record.classId === classId
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAddNote = () => {
    if (!classId) return
    setSelectedNote(null)
    setNoteFormData({
      content: "",
      topics: "",
      homework: "",
      objectives: ""
    })
    setSelectedDate(new Date().toISOString().split('T')[0])
    setIsNoteDialogOpen(true)
  }

  const handleEditNote = (note: ClassNote) => {
    setSelectedNote(note)
    setNoteFormData({
      content: note.content,
      topics: note.topics?.join(", ") || "",
      homework: note.homework || "",
      objectives: note.objectives || ""
    })
    setSelectedDate(note.date)
    setIsNoteDialogOpen(true)
  }

  const handleSaveNote = async () => {
    if (!noteFormData.content.trim() || !selectedDate || !classId) return

    try {
      const noteData = {
        classId: classId,
        date: selectedDate,
        content: noteFormData.content,
        topics: noteFormData.topics ? noteFormData.topics.split(",").map(t => t.trim()) : undefined,
        homework: noteFormData.homework || undefined,
        objectives: noteFormData.objectives || undefined
      }

      if (selectedNote) {
        await actions.updateClassNote(selectedNote.id, {
          ...noteData,
          updatedDate: new Date().toISOString().split('T')[0]
        })
      } else {
        await actions.addClassNote(noteData)
      }

      setIsNoteDialogOpen(false)
      setSelectedNote(null)
      setNoteFormData({
        content: "",
        topics: "",
        homework: "",
        objectives: ""
      })
      setSelectedDate("")
    } catch (error) {
      console.error('Failed to save note:', error)
      // You could add a toast notification here
    }
  }

  const getStudentInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getAvailableStudents = () => {
    return (data.students || []).filter(student =>
      !(classData?.enrolledStudents || []).includes(student.id)
    )
  }

  const handleEnrollStudent = async (studentId: string, enrolled: boolean) => {
    if (!classId) return
    try {
      if (enrolled) {
        await actions.enrollStudent(classId, studentId)
      } else {
        await actions.unenrollStudent(classId, studentId)
      }
    } catch (error) {
      console.error('Failed to update student enrollment:', error)
    }
  }

  const handleAddSchedule = () => {
    setSelectedSchedule(null)
    setScheduleFormData({ dayOfWeek: "", startTime: "", endTime: "" })
    setIsScheduleDialogOpen(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setScheduleFormData({
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime
    })
    setIsScheduleDialogOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!scheduleFormData.dayOfWeek || !scheduleFormData.startTime || !scheduleFormData.endTime || !classId) return

    try {
      if (selectedSchedule) {
        await actions.updateSchedule(selectedSchedule.id, {
          dayOfWeek: parseInt(scheduleFormData.dayOfWeek),
          startTime: scheduleFormData.startTime,
          endTime: scheduleFormData.endTime
        })
      } else {
        await actions.addSchedule({
          classId: classId,
          dayOfWeek: parseInt(scheduleFormData.dayOfWeek),
          startTime: scheduleFormData.startTime,
          endTime: scheduleFormData.endTime
        })
      }

      setIsScheduleDialogOpen(false)
      setSelectedSchedule(null)
      setScheduleFormData({ dayOfWeek: "", startTime: "", endTime: "" })
    } catch (error) {
      console.error('Failed to save schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await actions.deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handleAddNoteFromList = () => {
    setSelectedNote(null)
    setNoteFormData({
      content: "",
      topics: "",
      homework: "",
      objectives: ""
    })
    setSelectedDate("")
    setIsNotesListDialogOpen(false)
    setIsNoteDialogOpen(true)
  }

  const handleEditNoteFromList = (note: ClassNote) => {
    setSelectedNote(note)
    setNoteFormData({
      content: note.content,
      topics: note.topics?.join(", ") || "",
      homework: note.homework || "",
      objectives: note.objectives || ""
    })
    setSelectedDate(note.date)
    setIsNotesListDialogOpen(false)
    setIsNoteDialogOpen(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await actions.deleteClassNote(noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleAddStudent = () => {
    setSelectedStudent(null)
    setStudentFormData({
      name: "",
      email: "",
      phone: "",
      grade: "",
      parentContact: ""
    })
    setIsStudentDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setStudentFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      parentContact: student.parentContact
    })
    setIsStudentDialogOpen(true)
  }

  const handleSaveStudent = async () => {
    if (!studentFormData.name.trim() || !studentFormData.email.trim()) return

    try {
      if (selectedStudent) {
        await actions.updateStudent(selectedStudent.id, {
          name: studentFormData.name,
          email: studentFormData.email,
          phone: studentFormData.phone,
          grade: studentFormData.grade,
          parentContact: studentFormData.parentContact
        })
      } else {
        const newStudent = await actions.addStudent({
          name: studentFormData.name,
          email: studentFormData.email,
          phone: studentFormData.phone,
          grade: studentFormData.grade,
          parentContact: studentFormData.parentContact
        })
        // Auto-enroll the new student in this class
        if (classId) await actions.enrollStudent(classId, newStudent.id)
      }

      setIsStudentDialogOpen(false)
      setSelectedStudent(null)
      setStudentFormData({
        name: "",
        email: "",
        phone: "",
        grade: "",
        parentContact: ""
      })
    } catch (error) {
      console.error('Failed to save student:', error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This will remove them from all classes and attendance records.')) {
      try {
        await actions.deleteStudent(studentId)
      } catch (error) {
        console.error('Failed to delete student:', error)
      }
    }
  }

  const handleUnenrollStudent = async (studentId: string) => {
    if (classId && window.confirm('Are you sure you want to unenroll this student from the class?')) {
      try {
        await actions.unenrollStudent(classId, studentId)
      } catch (error) {
        console.error('Failed to unenroll student:', error)
      }
    }
  }

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.find(record => record.date === date)
  }

  const getAttendanceStats = () => {
    const totalRecords = attendanceRecords.length
    if (totalRecords === 0) return { rate: 0, totalClasses: 0 }

    const totalStudentEntries = attendanceRecords.reduce((sum, record) =>
      sum + (record.attendanceData || []).length, 0
    )
    const presentCount = attendanceRecords.reduce((sum, record) =>
      sum + (record.attendanceData || []).filter(entry => entry.status === 'present').length, 0
    )

    return {
      rate: totalStudentEntries > 0 ? Math.round((presentCount / totalStudentEntries) * 100) : 0,
      totalClasses: totalRecords
    }
  }

  const attendanceStats = getAttendanceStats()

  const getAttendanceChartData = () => {
    return attendanceRecords.map(record => {
      const presentCount = (record.attendanceData || []).filter(entry => entry.status === 'present').length
      const totalCount = (record.attendanceData || []).length
      const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

      return {
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: record.date,
        attendanceRate,
        present: presentCount,
        absent: (record.attendanceData || []).filter(entry => entry.status === 'absent').length,
        late: (record.attendanceData || []).filter(entry => entry.status === 'late').length,
        total: totalCount
      }
    }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/classes')} aria-label="Back to Classes">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: classData.color }}
          />
          <div>
            <h1 className="text-2xl font-bold">{classData.name}</h1>
            <p className="text-muted-foreground">{classData.subject} • {classData.room}</p>
          </div>
        </div>
      </div>

      {/* Class Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsStudentManagementDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              of {classData.capacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsScheduleDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Schedule</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classSchedules.length}</div>
            <p className="text-xs text-muted-foreground">
              {classSchedules.length === 1 ? 'session per week' : 'sessions per week'}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsNotesListDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classNotes.length}</div>
            <p className="text-xs text-muted-foreground">
              notes recorded
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsAttendanceStatsDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.rate}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.totalClasses} classes recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="sticky top-0 bg-background z-10 pb-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="students" className="whitespace-nowrap">Students</TabsTrigger>
            <TabsTrigger value="notes" className="whitespace-nowrap">Class Notes</TabsTrigger>
            <TabsTrigger value="attendance" className="whitespace-nowrap">Attendance History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Class Information */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{classData.description || "No description provided"}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Room</label>
                    <p className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {classData.room}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                    <p className="mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classData.capacity} students
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{formatDate(classData.createdDate)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardContent className="pt-6">
                {classSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {classSchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{getDayName(schedule.dayOfWeek)}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No schedule set for this class</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Enrolled Students ({enrolledStudents.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEnrollmentDialogOpen(true)} aria-label="Enroll Existing Student">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Enroll Existing</span>
              </Button>
              <Button onClick={handleAddStudent} aria-label="Add New Student">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Add New Student</span>
              </Button>
            </div>
          </div>
          {enrolledStudents.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {enrolledStudents.map((student) => (
                <Card key={student.id} className="flex flex-col h-full">
                  <CardContent className="pt-4 flex flex-col h-full">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>{getStudentInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{student.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{student.grade}</div>
                        <div className="text-sm text-muted-foreground truncate">{student.email}</div>
                        <div className="text-sm text-muted-foreground truncate">{student.phone}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                        aria-label="Edit Student"
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnenrollStudent(student.id)}
                        aria-label="Unenroll from Class"
                        className="flex-1"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        aria-label="Delete Student"
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No students enrolled in this class yet</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setIsEnrollmentDialogOpen(true)} aria-label="Enroll Existing Student">
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">Enroll Existing Student</span>
                    </Button>
                    <Button onClick={handleAddStudent} aria-label="Add New Student">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">Add New Student</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Class Notes</h3>
            <Button onClick={handleAddNote} aria-label="Add Note">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Add Note</span>
            </Button>
          </div>
          {classNotes.length > 0 ? (
            <div className="space-y-4">
              {classNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{formatDate(note.date)}</CardTitle>
                        <CardDescription>
                          Added on {formatDate(note.createdDate)}
                          {note.updatedDate !== note.createdDate && (
                            <span> • Updated on {formatDate(note.updatedDate)}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note)}
                        aria-label="Edit Note"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                    {note.topics && note.topics.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Topics: </span>
                        <span className="text-sm text-muted-foreground">
                          {note.topics.join(", ")}
                        </span>
                      </div>
                    )}
                    {note.homework && (
                      <div>
                        <span className="text-sm font-medium">Homework: </span>
                        <span className="text-sm text-muted-foreground">{note.homework}</span>
                      </div>
                    )}
                    {note.objectives && (
                      <div>
                        <span className="text-sm font-medium">Objectives: </span>
                        <span className="text-sm text-muted-foreground">{note.objectives}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No class notes recorded yet</p>
                  <Button onClick={handleAddNote} aria-label="Add Your First Note">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Add Your First Note</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Attendance History</h3>
          </div>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map((record) => {
                const presentCount = (record.attendanceData || []).filter(entry => entry.status === 'present').length
                const totalCount = (record.attendanceData || []).length
                const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

                return (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{formatDate(record.date)}</CardTitle>
                          <CardDescription>
                            {presentCount} of {totalCount} students present ({attendanceRate}%)
                          </CardDescription>
                        </div>
                        <Badge variant={attendanceRate >= 80 ? "default" : attendanceRate >= 60 ? "secondary" : "destructive"}>
                          {attendanceRate}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {(record.attendanceData || []).map((entry) => {
                          const student = (data.students || []).find(s => s.id === entry.studentId)
                          return (
                            <div key={entry.studentId} className="flex items-center gap-2 p-2 border rounded">
                              <div className={`w-2 h-2 rounded-full ${entry.status === 'present' ? 'bg-green-500' :
                                entry.status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                              <span className="text-sm">{student?.name || 'Unknown Student'}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {entry.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found for this class</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[525px]" aria-describedby="note-dialog-description">
          <DialogHeader>
            <DialogTitle>{selectedNote ? 'Edit Class Note' : 'Add Class Note'}</DialogTitle>
            <DialogDescription id="note-dialog-description">
              {selectedNote ? 'Edit your class note for the selected date' : 'Add a new note for this class'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-date">Date</Label>
              <input
                id="note-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Class Notes</Label>
              <Textarea
                id="note-content"
                value={noteFormData.content}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What happened in class today? Key discussions, student participation, etc."
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-topics">Topics Covered</Label>
              <Input
                id="note-topics"
                value={noteFormData.topics}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, topics: e.target.value }))}
                placeholder="Topics separated by commas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-homework">Homework Assigned</Label>
              <Input
                id="note-homework"
                value={noteFormData.homework}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, homework: e.target.value }))}
                placeholder="Homework assignments for students"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-objectives">Learning Objectives</Label>
              <Input
                id="note-objectives"
                value={noteFormData.objectives}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, objectives: e.target.value }))}
                placeholder="What should students learn from this lesson?"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveNote} disabled={!noteFormData.content.trim() || !selectedDate} aria-label={selectedNote ? 'Update Note' : 'Add Note'}>
                <span className="sm:inline">{selectedNote ? 'Update Note' : 'Add Note'}</span>
              </Button>
              <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)} aria-label="Cancel">
                <span className="sm:inline">Cancel</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes List Management Dialog */}
      <Dialog open={isNotesListDialogOpen} onOpenChange={setIsNotesListDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto" aria-describedby="notes-list-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manage Class Notes - {classData?.name}
            </DialogTitle>
            <DialogDescription id="notes-list-dialog-description">
              View, add, edit, and delete class notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Class Notes ({classNotes.length})
              </h4>
              <Button onClick={handleAddNoteFromList} aria-label="Add Note">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Add Note</span>
              </Button>
            </div>

            {/* Notes List */}
            {classNotes.length > 0 ? (
              <div className="space-y-4">
                {classNotes.map((note) => (
                  <div key={note.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{formatDate(note.date)}</h5>
                        <Badge variant="outline" className="text-xs">
                          {new Date(note.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm line-clamp-2">{note.content}</p>
                      </div>
                      {note.topics && note.topics.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Topics: </span>
                          <span className="text-sm text-muted-foreground">
                            {note.topics.join(", ")}
                          </span>
                        </div>
                      )}
                      {note.homework && (
                        <div>
                          <span className="text-sm font-medium">Homework: </span>
                          <span className="text-sm text-muted-foreground">{note.homework}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Added {formatDate(note.createdDate)}
                        {note.updatedDate !== note.createdDate && (
                          <span> • Updated {formatDate(note.updatedDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditNoteFromList(note)}
                        aria-label="Edit Note"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline sm:ml-2">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        aria-label="Delete Note"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline sm:ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No class notes found</p>
                <Button onClick={handleAddNoteFromList} aria-label="Add Your First Note">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Add Your First Note</span>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Management Dialog */}
      <Dialog open={isStudentManagementDialogOpen} onOpenChange={setIsStudentManagementDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto" aria-describedby="student-management-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Students - {classData?.name}
            </DialogTitle>
            <DialogDescription id="student-management-dialog-description">
              View, add, edit, and manage student enrollment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Enrolled Students ({enrolledStudents.length})
              </h4>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setIsStudentManagementDialogOpen(false)
                  setIsEnrollmentDialogOpen(true)
                }} aria-label="Enroll Existing Student">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Enroll Existing</span>
                </Button>
                <Button onClick={() => {
                  setIsStudentManagementDialogOpen(false)
                  handleAddStudent()
                }} aria-label="Add New Student">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Add New Student</span>
                </Button>
              </div>
            </div>

            {/* Students List */}
            {enrolledStudents.length > 0 ? (
              <div className="space-y-4">
                {enrolledStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getStudentInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.grade}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                      <div className="text-sm text-muted-foreground">{student.phone}</div>
                      <div className="text-sm text-muted-foreground">Parent: {student.parentContact}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsStudentManagementDialogOpen(false)
                          handleEditStudent(student)
                        }}
                        aria-label="Edit Student"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline sm:ml-2">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnenrollStudent(student.id)}
                        aria-label="Unenroll Student"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="hidden sm:inline sm:ml-2">Unenroll</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        aria-label="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline sm:ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No students enrolled yet</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => {
                    setIsStudentManagementDialogOpen(false)
                    setIsEnrollmentDialogOpen(true)
                  }} aria-label="Enroll Existing Student">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Enroll Existing Student</span>
                  </Button>
                  <Button onClick={() => {
                    setIsStudentManagementDialogOpen(false)
                    handleAddStudent()
                  }} aria-label="Add New Student">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Add New Student</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Student Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="sm:max-w-[525px]" aria-describedby="student-dialog-description">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription id="student-dialog-description">
              {selectedStudent ? 'Update student information' : 'Add a new student and automatically enroll them in this class'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                value={studentFormData.name}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={studentFormData.email}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="student@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone Number</Label>
              <Input
                id="student-phone"
                value={studentFormData.phone}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-grade">Grade Level</Label>
              <Input
                id="student-grade"
                value={studentFormData.grade}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g., 10th Grade, Senior, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-parent">Parent/Guardian Contact</Label>
              <Input
                id="student-parent"
                value={studentFormData.parentContact}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, parentContact: e.target.value }))}
                placeholder="Parent email or phone number"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveStudent} disabled={!studentFormData.name.trim() || !studentFormData.email.trim()} aria-label={selectedStudent ? 'Update Student' : 'Add Student'}>
                <span className="sm:inline">{selectedStudent ? 'Update Student' : 'Add Student'}</span>
              </Button>
              <Button variant="outline" onClick={() => setIsStudentDialogOpen(false)} aria-label="Cancel">
                <span className="sm:inline">Cancel</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="enrollment-dialog-description">
          <DialogHeader>
            <DialogTitle>Manage Student Enrollment</DialogTitle>
            <DialogDescription id="enrollment-dialog-description">
              Add or remove students from {classData?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {data.students.map((student) => {
                const isEnrolled = (classData?.enrolledStudents || []).includes(student.id)
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getStudentInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.grade}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                    <Button
                      variant={isEnrolled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleEnrollStudent(student.id, !isEnrolled)}
                      aria-label={isEnrolled ? "Unenroll Student" : "Enroll Student"}
                    >
                      {isEnrolled ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          <span className="hidden sm:inline sm:ml-2">Unenroll</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span className="hidden sm:inline sm:ml-2">Enroll</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsEnrollmentDialogOpen(false)} aria-label="Done">
                <span className="sm:inline">Done</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Management Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="schedule-dialog-description">
          <DialogHeader>
            <DialogTitle>Manage Class Schedule</DialogTitle>
            <DialogDescription id="schedule-dialog-description">
              Add, edit, or remove schedule entries for {classData?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add Schedule Form */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">{selectedSchedule ? 'Edit Schedule Entry' : 'Add New Schedule Entry'}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={scheduleFormData.dayOfWeek} onValueChange={(value: string) => setScheduleFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={scheduleFormData.startTime}
                    onChange={(e) => setScheduleFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={scheduleFormData.endTime}
                    onChange={(e) => setScheduleFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSchedule} disabled={!scheduleFormData.dayOfWeek || !scheduleFormData.startTime || !scheduleFormData.endTime} aria-label={selectedSchedule ? 'Update Schedule' : 'Add Schedule'}>
                  <span className="sm:inline">{selectedSchedule ? 'Update' : 'Add Schedule'}</span>
                </Button>
                {selectedSchedule && (
                  <Button variant="outline" onClick={() => {
                    setSelectedSchedule(null)
                    setScheduleFormData({ dayOfWeek: "", startTime: "", endTime: "" })
                  }} aria-label="Cancel">
                    <span className="sm:inline">Cancel</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Current Schedule List */}
            <div className="space-y-4">
              <h4 className="font-medium">Current Schedule ({classSchedules.length})</h4>
              {classSchedules.length > 0 ? (
                <div className="space-y-3">
                  {classSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{getDayName(schedule.dayOfWeek)}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSchedule(schedule)}
                          aria-label="Edit Schedule"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          aria-label="Delete Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No schedule entries found</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} aria-label="Done">
                <span className="sm:inline">Done</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Statistics Dialog */}
      <Dialog open={isAttendanceStatsDialogOpen} onOpenChange={setIsAttendanceStatsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto" aria-describedby="attendance-stats-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance Trends - {classData?.name}
            </DialogTitle>
            <DialogDescription id="attendance-stats-dialog-description">
              Track attendance rates and patterns over time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{attendanceStats.rate}%</div>
                      <p className="text-xs text-muted-foreground">Overall Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{attendanceStats.totalClasses}</div>
                      <p className="text-xs text-muted-foreground">Total Classes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-2xl font-bold">{enrolledStudents.length}</div>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {attendanceRecords.reduce((sum, record) =>
                          sum + (record.attendanceData || []).length, 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate Over Time</CardTitle>
                <CardDescription>
                  Track how attendance rates change across different class sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getAttendanceChartData().length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getAttendanceChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'Attendance Rate']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0] && payload[0].payload) {
                              const data = payload[0].payload as any
                              return `${label} - ${data.present}/${data.total} present`
                            }
                            return label
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="attendanceRate"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No attendance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Class Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Class Session Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of attendance status for each class session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getAttendanceChartData().length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getAttendanceChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="present" stackId="a" fill="#22c55e" name="Present" />
                        <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
                        <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No attendance data available
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsAttendanceStatsDialogOpen(false)} aria-label="Close">
                <span className="sm:inline">Close</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}