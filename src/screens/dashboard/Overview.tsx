import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, Calendar, CalendarCheck, Clock, MapPin } from "lucide-react"
import { Class, Student, Schedule, Meeting, AttendanceRecord, ClassNote } from "@/data/mockData"

interface OverviewProps {
  data: {
    classes: Class[]
    students: Student[]
    schedules: Schedule[]
    meetings: Meeting[]
    attendanceRecords: AttendanceRecord[]
    classNotes: ClassNote[]
  }
  onNavigate?: (view: string) => void
  onNavigateToClass?: (classId: string) => void
}

export function Overview({ data, onNavigate, onNavigateToClass }: OverviewProps) {
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

  const todayMeetings = data.meetings
    .filter(meeting => {
      const today = new Date().toISOString().split('T')[0]
      return meeting.date === today && meeting.status === "scheduled"
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.('students')}
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
          onClick={() => onNavigate?.('classes')}
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
          onClick={() => onNavigate?.('calendar')}
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
          onClick={() => onNavigate?.('meetings')}
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

      {/* Today's Schedule Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>
              Your class schedule for {getDayName(new Date().getDay())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => schedule.classData && onNavigateToClass?.(schedule.classData.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: schedule.classData?.color }}
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {schedule.classData?.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {schedule.classData?.room}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {schedule.classData?.subject} • {schedule.classData?.enrolledStudents.length} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No classes scheduled for today</p>
                  <p className="text-xs">Enjoy your day off!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Today's Meetings
            </CardTitle>
            <CardDescription>
              Scheduled meetings and conferences for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayMeetings.length > 0 ? (
                todayMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {meeting.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {meeting.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {meeting.participantType}
                        </Badge>
                        <Badge variant={meeting.meetingType === "virtual" ? "secondary" : "outline"} className="text-xs">
                          {meeting.meetingType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {meeting.startTime} - {meeting.endTime}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No meetings scheduled for today</p>
                  <p className="text-xs">Focus time for teaching!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}