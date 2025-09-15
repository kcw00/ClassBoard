import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
// Toast functionality removed - using console logging instead
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp,
  Plus,
  Edit,
  Search,
  Eye,
  BarChart3
} from "lucide-react"
import { useAppData } from "@/context/AppDataMigrationContext"

export default function AttendanceManagement() {
  const { data, actions } = useAppData()
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [attendanceData, setAttendanceData] = useState<{[studentId: string]: {status: string, notes: string}}>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isRecordDetailOpen, setIsRecordDetailOpen] = useState(false)
  const [selectedOverviewStat, setSelectedOverviewStat] = useState<string | null>(null)
  const [isOverviewDetailOpen, setIsOverviewDetailOpen] = useState(false)
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editAttendanceData, setEditAttendanceData] = useState<{[studentId: string]: {status: string, notes: string}}>({})

  // Get attendance statistics
  const getAttendanceStats = () => {
    const totalRecords = data.attendanceRecords.flatMap(record => record.attendanceData)
    const presentCount = totalRecords.filter(entry => entry.status === "present").length
    const absentCount = totalRecords.filter(entry => entry.status === "absent").length
    const lateCount = totalRecords.filter(entry => entry.status === "late").length
    const excusedCount = totalRecords.filter(entry => entry.status === "excused").length
    
    const total = totalRecords.length
    const attendanceRate = total > 0 ? (presentCount / total) * 100 : 0

    return {
      total,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      attendanceRate: Math.round(attendanceRate)
    }
  }

  // Get recent attendance records
  const getRecentAttendance = () => {
    return data.attendanceRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }

  // Get class attendance summary
  const getClassAttendanceSummary = () => {
    return data.classes.map(classItem => {
      const classRecords = data.attendanceRecords.filter(record => record.classId === classItem.id)
      const allEntries = classRecords.flatMap(record => record.attendanceData)
      
      const present = allEntries.filter(entry => entry.status === "present").length
      const total = allEntries.length
      const rate = total > 0 ? (present / total) * 100 : 0

      return {
        ...classItem,
        attendanceRate: Math.round(rate),
        totalSessions: classRecords.length,
        studentsEnrolled: classItem.enrolledStudents.length
      }
    })
  }

  // Initialize attendance data for a class
  const initializeAttendanceData = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (classItem) {
      const initialData: {[studentId: string]: {status: string, notes: string}} = {}
      classItem.enrolledStudents.forEach(studentId => {
        initialData[studentId] = { status: "present", notes: "" }
      })
      setAttendanceData(initialData)
    }
  }

  // Handle taking attendance
  const handleTakeAttendance = () => {
    setIsAttendanceDialogOpen(true)
    // Reset selected class when opening dialog
    setSelectedClass("")
    setAttendanceData({})
  }

  // Save attendance record
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClass || !selectedDate) {
      console.error("❌ Please select class and date")
      return
    }

    if (Object.keys(attendanceData).length === 0) {
      console.error("❌ No attendance data to save")
      return
    }

    const attendanceEntries = Object.entries(attendanceData).map(([studentId, data]) => ({
      studentId,
      status: data.status as any,
      notes: data.notes || ""
    }))

    const newRecord = {
      classId: selectedClass,
      date: selectedDate,
      attendanceData: attendanceEntries
    }

    actions.addAttendanceRecord(newRecord)
    setIsAttendanceDialogOpen(false)
    setAttendanceData({})
    setSelectedClass("")
    console.log("✅ Attendance recorded successfully")
  }

  // Handle overview card clicks
  const handleOverviewCardClick = (statType: string) => {
    setSelectedOverviewStat(statType)
    setIsOverviewDetailOpen(true)
  }

  // Handle recent record card clicks
  const handleRecordClick = (record: any) => {
    setSelectedRecord(record)
    setIsRecordDetailOpen(true)
  }

  // Handle class card clicks
  const handleClassCardClick = (classId: string) => {
    navigate(`/classes/${classId}`)
  }

  // Get students for a specific status from all records
  const getStudentsByStatus = (status: string) => {
    const allEntries = data.attendanceRecords.flatMap(record => 
      record.attendanceData.filter(entry => entry.status === status)
    )
    return allEntries.map(entry => {
      const student = data.students.find(s => s.id === entry.studentId)
      const record = data.attendanceRecords.find(r => 
        r.attendanceData.some(a => a.studentId === entry.studentId)
      )
      const classItem = data.classes.find(c => c.id === record?.classId)
      return { ...student, classInfo: classItem, record, notes: entry.notes }
    }).filter(Boolean)
  }

  // Handle edit record
  const handleEditRecord = (record: any) => {
    setEditingRecord(record)
    // Initialize edit data with existing attendance data
    const initialEditData: {[studentId: string]: {status: string, notes: string}} = {}
    record.attendanceData.forEach((entry: any) => {
      initialEditData[entry.studentId] = {
        status: entry.status,
        notes: entry.notes || ""
      }
    })
    setEditAttendanceData(initialEditData)
    setIsEditRecordOpen(true)
  }

  // Save edited attendance record
  const handleSaveEditedRecord = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingRecord) return

    const updatedAttendanceData = Object.entries(editAttendanceData).map(([studentId, data]) => ({
      studentId,
      status: data.status as any,
      notes: data.notes || ""
    }))

    const updatedRecord = {
      ...editingRecord,
      attendanceData: updatedAttendanceData
    }

    actions.updateAttendanceRecord(editingRecord.id, updatedRecord)
    setIsEditRecordOpen(false)
    setEditingRecord(null)
    setEditAttendanceData({})
    console.log("✅ Attendance record updated successfully")
  }

  const stats = getAttendanceStats()
  const recentAttendance = getRecentAttendance()
  const classAttendanceSummary = getClassAttendanceSummary()

  // Filter recent attendance based on search and filter
  const filteredRecentAttendance = recentAttendance.filter(record => {
    const classItem = data.classes.find(c => c.id === record.classId)
    const matchesSearch = classItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         record.date.includes(searchTerm)
    
    if (filterStatus === "all") return matchesSearch
    
    const hasStatus = record.attendanceData.some(entry => entry.status === filterStatus)
    return matchesSearch && hasStatus
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div>
          <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleTakeAttendance} aria-label="Take Attendance">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Take Attendance</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" aria-describedby="take-attendance-description">
              <DialogHeader>
                <DialogTitle>Take Attendance</DialogTitle>
                <DialogDescription id="take-attendance-description">
                  Record attendance for {data.classes.find(c => c.id === selectedClass)?.name || 'selected class'} on {selectedDate}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveAttendance} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Select value={selectedClass} onValueChange={(value) => {
                      setSelectedClass(value)
                      if (value) {
                        initializeAttendanceData(value)
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.classes.map(classItem => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    {selectedClass && (
                      <div className="p-3 bg-muted rounded-lg flex-1">
                        <p className="text-sm font-medium">
                          Students: {data.classes.find(c => c.id === selectedClass)?.enrolledStudents.length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.classes.find(c => c.id === selectedClass)?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Student Attendance</h4>
                  {selectedClass && (
                    <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
                      {data.classes.find(c => c.id === selectedClass)?.enrolledStudents.map(studentId => {
                        const student = data.students.find(s => s.id === studentId)
                        if (!student) return null
                        
                        return (
                          <div key={studentId} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 border rounded-lg bg-card">
                            <div className="md:col-span-5">
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <div className="md:col-span-3">
                              <Label className="block md:hidden text-sm font-medium mb-2">Status</Label>
                              <Select
                                value={attendanceData[studentId]?.status || "present"}
                                onValueChange={(value) => setAttendanceData({
                                  ...attendanceData,
                                  [studentId]: {
                                    ...attendanceData[studentId],
                                    status: value
                                  }
                                })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="excused">Excused</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-4">
                              <Label className="block md:hidden text-sm font-medium mb-2">Notes</Label>
                              <Input
                                placeholder="Add notes..."
                                className="w-full"
                                value={attendanceData[studentId]?.notes || ""}
                                onChange={(e) => setAttendanceData({
                                  ...attendanceData,
                                  [studentId]: {
                                    ...attendanceData[studentId],
                                    notes: e.target.value
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAttendanceDialogOpen(false)} aria-label="Cancel">
                    <span className="sm:inline">Cancel</span>
                  </Button>
                  <Button type="submit" aria-label="Save Attendance">
                    <span className="sm:inline">Save Attendance</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOverviewCardClick('overall')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
                <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={stats.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOverviewCardClick('present')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOverviewCardClick('absent')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOverviewCardClick('late')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <div className="sticky top-0 bg-background z-10 pb-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="recent" className="whitespace-nowrap">Recent Records</TabsTrigger>
            <TabsTrigger value="classes" className="whitespace-nowrap">Class Summary</TabsTrigger>
            <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Records</CardTitle>
              <CardDescription>Latest attendance entries across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by class name or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                {filteredRecentAttendance.map(record => {
                  const classItem = data.classes.find(c => c.id === record.classId)
                  const presentCount = record.attendanceData.filter(entry => entry.status === "present").length
                  const totalCount = record.attendanceData.length
                  const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0
                  
                  return (
                    <div 
                      key={record.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{classItem?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">{Math.round(attendanceRate)}% Present</p>
                            <p className="text-sm text-muted-foreground">{presentCount}/{totalCount} students</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRecordClick(record)
                              }}
                              aria-label="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRecord(record)
                              }}
                              aria-label="Edit Attendance"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                          Present: {record.attendanceData.filter(e => e.status === "present").length}
                        </Badge>
                        <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs whitespace-nowrap">
                          Absent: {record.attendanceData.filter(e => e.status === "absent").length}
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">
                          Late: {record.attendanceData.filter(e => e.status === "late").length}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
                          Excused: {record.attendanceData.filter(e => e.status === "excused").length}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Class Attendance Summary</CardTitle>
              <CardDescription>Attendance overview for each class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {classAttendanceSummary.map(classData => (
                  <div 
                    key={classData.id} 
                    className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow hover:bg-accent/50"
                    onClick={() => handleClassCardClick(classData.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{classData.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{classData.attendanceRate}%</Badge>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Students Enrolled:</span>
                        <span>{classData.studentsEnrolled}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Sessions:</span>
                        <span>{classData.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subject:</span>
                        <span>{classData.subject}</span>
                      </div>
                    </div>
                    <Progress value={classData.attendanceRate} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Analytics</CardTitle>
              <CardDescription>Detailed attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOverviewCardClick('distribution')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Present</span>
                        </div>
                        <span className="text-sm font-medium">{stats.present} ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Absent</span>
                        </div>
                        <span className="text-sm font-medium">{stats.absent} ({stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Late</span>
                        </div>
                        <span className="text-sm font-medium">{stats.late} ({stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Excused</span>
                        </div>
                        <span className="text-sm font-medium">{stats.excused} ({stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOverviewCardClick('stats')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Records:</span>
                        <span className="text-sm font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Classes:</span>
                        <span className="text-sm font-medium">{data.classes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Students:</span>
                        <span className="text-sm font-medium">{data.students.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Attendance Rate:</span>
                        <span className="text-sm font-medium">{stats.attendanceRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Overview Detail Dialog */}
      <Dialog open={isOverviewDetailOpen} onOpenChange={setIsOverviewDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="overview-detail-description">
          <DialogHeader>
            <DialogTitle>
              {selectedOverviewStat === 'overall' && 'Overall Attendance Details'}
              {selectedOverviewStat === 'present' && 'Present Students Details'}
              {selectedOverviewStat === 'absent' && 'Absent Students Details'}
              {selectedOverviewStat === 'late' && 'Late Students Details'}
              {selectedOverviewStat === 'distribution' && 'Status Distribution Analysis'}
              {selectedOverviewStat === 'stats' && 'System Statistics'}
              {!selectedOverviewStat && 'Attendance Details'}
            </DialogTitle>
            <DialogDescription id="overview-detail-description">
              Detailed breakdown of attendance data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedOverviewStat === 'overall' && (
              <div>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
                        <p className="text-sm text-muted-foreground">Overall Rate</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Breakdown by Status:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span>Present: {stats.present} students</span>
                      <span>{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span>Absent: {stats.absent} students</span>
                      <span>{stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-yellow-50 rounded">
                      <span>Late: {stats.late} students</span>
                      <span>{stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span>Excused: {stats.excused} students</span>
                      <span>{stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(selectedOverviewStat === 'present' || selectedOverviewStat === 'absent' || selectedOverviewStat === 'late') && (
              <div>
                <div className="space-y-3">
                  <h4 className="font-medium">
                    Students with {selectedOverviewStat} status:
                  </h4>
                  {getStudentsByStatus(selectedOverviewStat || '').map((studentData: any, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{studentData?.name}</p>
                          <p className="text-sm text-muted-foreground">{studentData?.email}</p>
                          <p className="text-sm text-muted-foreground">Class: {studentData?.classInfo?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={
                            selectedOverviewStat === 'present' ? 'bg-green-100 text-green-800' :
                            selectedOverviewStat === 'absent' ? 'bg-red-100 text-red-800' :
                            selectedOverviewStat === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {selectedOverviewStat?.charAt(0).toUpperCase() + selectedOverviewStat?.slice(1)}
                          </Badge>
                          {studentData?.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {studentData.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOverviewStat === 'distribution' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                      <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                      <p className="text-sm text-muted-foreground">Present</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
                      <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                      <p className="text-sm text-muted-foreground">Absent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                      <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                      <p className="text-sm text-muted-foreground">Late</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                      <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                      <p className="text-sm text-muted-foreground">Excused</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Attendance Trends</h4>
                  <div className="space-y-2">
                    <Progress value={stats.total > 0 ? (stats.present / stats.total) * 100 : 0} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Present Rate: {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</span>
                      <span>Absent Rate: {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedOverviewStat === 'stats' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Classes:</span>
                        <span className="font-medium">{data.classes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Students:</span>
                        <span className="font-medium">{data.students.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Class Size:</span>
                        <span className="font-medium">
                          {data.classes.length > 0 ? Math.round(data.classes.reduce((sum, c) => sum + c.enrolledStudents.length, 0) / data.classes.length) : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Overall Attendance:</span>
                        <span className="font-medium">{stats.attendanceRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Performing Class:</span>
                        <span className="font-medium">
                          {classAttendanceSummary.length > 0 ? 
                            classAttendanceSummary.reduce((best, current) => 
                              current.attendanceRate > best.attendanceRate ? current : best
                            ).name : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="font-medium">{data.attendanceRecords.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog open={isRecordDetailOpen} onOpenChange={setIsRecordDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="record-detail-description">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
            <DialogDescription id="record-detail-description">
              {selectedRecord ? (
                <>
                  {data.classes.find(c => c.id === selectedRecord.classId)?.name || 'Class'} - {new Date(selectedRecord.date).toLocaleDateString()}
                </>
              ) : (
                'View detailed attendance record information'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedRecord.attendanceData.filter((e: any) => e.status === "present").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {selectedRecord.attendanceData.filter((e: any) => e.status === "absent").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {selectedRecord.attendanceData.filter((e: any) => e.status === "late").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedRecord.attendanceData.filter((e: any) => e.status === "excused").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Excused</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Student Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRecord.attendanceData.map((entry: any, index: number) => {
                      const student = data.students.find(s => s.id === entry.studentId)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student?.name}</p>
                            <p className="text-sm text-muted-foreground">{student?.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={
                              entry.status === 'present' ? 'bg-green-100 text-green-800' :
                              entry.status === 'absent' ? 'bg-red-100 text-red-800' :
                              entry.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                            {entry.notes && (
                              <span className="text-sm text-muted-foreground max-w-xs truncate">
                                {entry.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Record Dialog */}
      <Dialog open={isEditRecordOpen} onOpenChange={setIsEditRecordOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" aria-describedby="edit-record-description">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription id="edit-record-description">
              {editingRecord ? (
                <>
                  {data.classes.find(c => c.id === editingRecord.classId)?.name || 'Class'} - {new Date(editingRecord.date).toLocaleDateString()}
                </>
              ) : (
                'Edit attendance record information'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {editingRecord && (
            <form onSubmit={handleSaveEditedRecord} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Class: {data.classes.find(c => c.id === editingRecord.classId)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(editingRecord.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Students: {editingRecord.attendanceData.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total enrolled
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Present: {Object.keys(editAttendanceData).length > 0 
                      ? Object.values(editAttendanceData).filter(d => d.status === 'present').length
                      : editingRecord.attendanceData.filter((e: any) => e.status === 'present').length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Currently marked
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Edit Student Attendance</h4>
                <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
                  {editingRecord.attendanceData.map((entry: any) => {
                    const student = data.students.find(s => s.id === entry.studentId)
                    if (!student) return null
                    
                    return (
                      <div key={entry.studentId} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg bg-card">
                        <div className="col-span-5">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={editAttendanceData[entry.studentId]?.status || entry.status}
                            onValueChange={(value) => setEditAttendanceData({
                              ...editAttendanceData,
                              [entry.studentId]: {
                                ...editAttendanceData[entry.studentId],
                                status: value
                              }
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Input
                            placeholder="Edit notes..."
                            className="w-full"
                            value={editAttendanceData[entry.studentId]?.notes || entry.notes || ""}
                            onChange={(e) => setEditAttendanceData({
                              ...editAttendanceData,
                              [entry.studentId]: {
                                ...editAttendanceData[entry.studentId],
                                status: editAttendanceData[entry.studentId]?.status || entry.status,
                                notes: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditRecordOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}