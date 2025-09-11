import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner@2.0.3"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  FileText, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  BookOpen,
  ClipboardList,
  Save,
  X,
  Plus
} from "lucide-react"
import { useAppData } from "@/context/AppDataContext"
import { FilePreviewModal } from "@/components/common"

interface StudentNote {
  id: string
  studentId: string
  title: string
  content: string
  date: string
  createdBy: string
}

export default function StudentDetails() {
  const { id: studentId } = useParams()
  const navigate = useNavigate()
  const { data, actions } = useAppData()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null)
  const [editingTestResult, setEditingTestResult] = useState<string | null>(null)
  const [editingHomework, setEditingHomework] = useState<string | null>(null)
  const [attendanceEditData, setAttendanceEditData] = useState<{status: string, notes: string}>({status: '', notes: ''})
  const [testResultEditData, setTestResultEditData] = useState<{score: number, feedback: string}>({score: 0, feedback: ''})
  const [homeworkEditData, setHomeworkEditData] = useState<{score: number, feedback: string, status: string}>({score: 0, feedback: '', status: ''})
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([
    {
      id: "1",
      studentId: studentId,
      title: "Academic Progress",
      content: "Student has shown significant improvement in mathematics. Recommend continued practice with algebra concepts.",
      date: "2024-12-15",
      createdBy: "Ms. Johnson"
    },
    {
      id: "2", 
      studentId: studentId,
      title: "Behavior Note",
      content: "Excellent participation in class discussions. Shows leadership qualities during group work.",
      date: "2024-12-10",
      createdBy: "Mr. Smith"
    }
  ])
  const [newNote, setNewNote] = useState({ title: "", content: "" })

  const student = data.students.find(s => s.id === studentId)
  
  if (!student) {
    return <div>Student not found</div>
  }

  const [editFormData, setEditFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    grade: student.grade,
    parentContact: student.parentContact
  })

  // Get student's enrolled classes
  const enrolledClasses = data.classes.filter(classItem => 
    classItem.enrolledStudents.includes(studentId)
  )

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const studentAttendance = data.attendanceRecords.flatMap(record => 
      record.attendanceData.filter(entry => entry.studentId === studentId)
    )
    
    const totalSessions = studentAttendance.length
    const presentSessions = studentAttendance.filter(entry => entry.status === "present").length
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0
    
    return {
      totalSessions,
      presentSessions,
      absentSessions: totalSessions - presentSessions,
      attendanceRate: Math.round(attendanceRate)
    }
  }

  // Get test results for student
  const getTestResults = () => {
    return data.testResults
      .filter(result => result.studentId === studentId)
      .map(result => {
        const test = data.tests.find(t => t.id === result.testId)
        return { ...result, test }
      })
      .sort((a, b) => new Date(b.submissionDate || b.createdDate).getTime() - new Date(a.submissionDate || a.createdDate).getTime())
  }

  // Calculate test statistics
  const getTestStats = () => {
    const testResults = getTestResults()
    const totalTests = testResults.length
    const passedTests = testResults.filter(result => {
      const percentage = (result.score / result.maxScore) * 100
      return percentage >= 70 // Assuming 70% is passing
    }).length
    
    const averageScore = totalTests > 0 
      ? testResults.reduce((sum, result) => sum + (result.score / result.maxScore) * 100, 0) / totalTests
      : 0

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      averageScore: Math.round(averageScore)
    }
  }

  // Get homework submissions for student
  const getHomeworkSubmissions = () => {
    return data.homeworkSubmissions
      .filter(submission => submission.studentId === studentId)
      .map(submission => {
        const assignment = data.homeworkAssignments.find(a => a.id === submission.assignmentId)
        return { ...submission, assignment }
      })
      .sort((a, b) => new Date(b.assignment?.dueDate || '').getTime() - new Date(a.assignment?.dueDate || '').getTime())
  }

  // Calculate homework statistics
  const getHomeworkStats = () => {
    const submissions = getHomeworkSubmissions()
    const totalAssignments = submissions.length
    const submittedAssignments = submissions.filter(s => s.status !== 'not_submitted').length
    const gradedAssignments = submissions.filter(s => s.status === 'graded' && s.score !== undefined)
    const lateSubmissions = submissions.filter(s => s.status === 'late').length
    
    const averageScore = gradedAssignments.length > 0
      ? gradedAssignments.reduce((sum, s) => sum + ((s.score || 0) / s.maxScore) * 100, 0) / gradedAssignments.length
      : 0

    const completionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0

    return {
      totalAssignments,
      submittedAssignments,
      notSubmittedAssignments: totalAssignments - submittedAssignments,
      gradedAssignments: gradedAssignments.length,
      lateSubmissions,
      averageScore: Math.round(averageScore),
      completionRate: Math.round(completionRate)
    }
  }

  const attendanceStats = getAttendanceStats()
  const testResults = getTestResults()
  const testStats = getTestStats()
  const homeworkSubmissions = getHomeworkSubmissions()
  const homeworkStats = getHomeworkStats()

  // Edit handlers
  const handleEditAttendance = (attendanceId: string, studentId: string, currentStatus: string, currentNotes: string) => {
    setEditingAttendance(attendanceId)
    setAttendanceEditData({ status: currentStatus, notes: currentNotes || '' })
  }

  const handleSaveAttendance = (attendanceId: string, studentId: string) => {
    const attendanceRecord = data.attendanceRecords.find(r => r.id === attendanceId)
    if (attendanceRecord) {
      const updatedAttendanceData = attendanceRecord.attendanceData.map(entry => 
        entry.studentId === studentId 
          ? { ...entry, status: attendanceEditData.status as any, notes: attendanceEditData.notes }
          : entry
      )
      actions.updateAttendanceRecord(attendanceId, { attendanceData: updatedAttendanceData })
      setEditingAttendance(null)
      toast.success("Attendance updated successfully")
    }
  }

  const handleEditTestResult = (resultId: string, currentScore: number, currentFeedback: string) => {
    setEditingTestResult(resultId)
    setTestResultEditData({ score: currentScore, feedback: currentFeedback || '' })
  }

  const handleSaveTestResult = (resultId: string) => {
    const testResult = data.testResults.find(r => r.id === resultId)
    if (testResult) {
      const percentage = (testResultEditData.score / testResult.maxScore) * 100
      const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
      
      actions.updateTestResult(resultId, {
        score: testResultEditData.score,
        percentage: Math.round(percentage),
        grade,
        feedback: testResultEditData.feedback
      })
      setEditingTestResult(null)
      toast.success("Test result updated successfully")
    }
  }

  const handleEditHomework = (submissionId: string, currentScore: number, currentFeedback: string, currentStatus: string) => {
    setEditingHomework(submissionId)
    setHomeworkEditData({ 
      score: currentScore || 0, 
      feedback: currentFeedback || '', 
      status: currentStatus 
    })
  }

  const handleSaveHomework = (submissionId: string) => {
    const submission = data.homeworkSubmissions.find(s => s.id === submissionId)
    if (submission) {
      const percentage = (homeworkEditData.score / submission.maxScore) * 100
      const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
      
      actions.updateHomeworkSubmission(submissionId, {
        score: homeworkEditData.score,
        grade,
        feedback: homeworkEditData.feedback,
        status: homeworkEditData.status as any,
        gradedDate: homeworkEditData.status === 'graded' ? new Date().toISOString().split('T')[0] : undefined
      })
      setEditingHomework(null)
      toast.success("Homework submission updated successfully")
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.updateStudent(studentId, editFormData)
    setIsEditDialogOpen(false)
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    const note: StudentNote = {
      id: (studentNotes.length + 1).toString(),
      studentId,
      title: newNote.title,
      content: newNote.content,
      date: new Date().toISOString().split('T')[0],
      createdBy: "Current User"
    }
    setStudentNotes([note, ...studentNotes])
    setNewNote({ title: "", content: "" })
    setIsNoteDialogOpen(false)
  }

  const handleDeleteNote = (noteId: string) => {
    setStudentNotes(studentNotes.filter(note => note.id !== noteId))
  }

  // Handle view attached file
  const handleViewAttachedFile = (result: any) => {
    if (result.attachedFile?.url) {
      setSelectedFile(result.attachedFile)
      setIsFilePreviewOpen(true)
    } else {
      toast.error("File not available")
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{student.name}</h2>
            <p className="text-muted-foreground hidden sm:block">
              Student Details & Performance
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} aria-label="Edit Student">
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-2">Edit Student</span>
        </Button>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="font-medium">{student.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Phone</span>
              </div>
              <p className="font-medium">{student.phone}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>Grade</span>
              </div>
              <Badge variant="secondary">{student.grade}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Parent Contact</span>
              </div>
              <p className="font-medium">{student.parentContact}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Enrollment Date</span>
            </div>
            <p className="font-medium">{new Date(student.enrollmentDate).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceStats.attendanceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={attendanceStats.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Test Score</p>
                <p className="text-2xl font-bold">{testStats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={testStats.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Classes Enrolled</p>
                <p className="text-2xl font-bold">{enrolledClasses.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Homework Score</p>
                <p className="text-2xl font-bold">{homeworkStats.averageScore}%</p>
              </div>
              <ClipboardList className="h-8 w-8 text-orange-600" />
            </div>
            <Progress value={homeworkStats.averageScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="attendance" className="h-full">
          <div className="sticky top-0 bg-background z-10 pb-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="attendance" className="whitespace-nowrap">Attendance</TabsTrigger>
              <TabsTrigger value="homework" className="whitespace-nowrap">Homework</TabsTrigger>
              <TabsTrigger value="tests" className="whitespace-nowrap">Test Results</TabsTrigger>
              <TabsTrigger value="classes" className="whitespace-nowrap">Enrolled Classes</TabsTrigger>
              <TabsTrigger value="notes" className="whitespace-nowrap">Notes</TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Details</CardTitle>
              <CardDescription>
                Detailed attendance record for all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.presentSessions}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absentSessions}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalSessions}</p>
                </div>
              </div>
              <div className="space-y-2">
                {data.attendanceRecords
                  .flatMap(record => 
                    record.attendanceData
                      .filter(entry => entry.studentId === studentId)
                      .map(entry => ({ ...entry, date: record.date, classId: record.classId, recordId: record.id }))
                  )
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((entry, index) => {
                    const classItem = data.classes.find(c => c.id === entry.classId)
                    const isEditing = editingAttendance === entry.recordId
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        {isEditing ? (
                          <div className="space-y-3">
                            {/* Title and cancel button on same row */}
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{classItem?.name}</p>
                              <Button size="sm" variant="ghost" onClick={() => setEditingAttendance(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Date with status and notes controls */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Date: {new Date(entry.date).toLocaleDateString()}</span>
                              <div className="flex items-center gap-2 ml-auto">
                                <Select 
                                  value={attendanceEditData.status} 
                                  onValueChange={(value) => setAttendanceEditData({...attendanceEditData, status: value})}
                                >
                                  <SelectTrigger className="w-32 text-foreground">
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
                            </div>
                            
                            {/* Notes textarea */}
                            <div>
                              <Textarea
                                placeholder="Notes..."
                                value={attendanceEditData.notes}
                                onChange={(e) => setAttendanceEditData({...attendanceEditData, notes: e.target.value})}
                                className="w-full min-h-[60px]"
                                rows={2}
                              />
                            </div>
                            
                            {/* Save button in bottom-right corner */}
                            <div className="flex justify-end">
                              <Button size="sm" onClick={() => handleSaveAttendance(entry.recordId, studentId)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{classItem?.name}</p>
                              <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                              {entry.notes && (
                                <p className="text-sm text-muted-foreground italic mt-1">"{entry.notes}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={entry.status === "present" ? "default" : "destructive"}
                                className={
                                  entry.status === "present" ? "bg-green-100 text-green-800" :
                                  entry.status === "late" ? "bg-yellow-100 text-yellow-800" :
                                  entry.status === "excused" ? "bg-blue-100 text-blue-800" :
                                  "bg-red-100 text-red-800"
                                }
                              >
                                {entry.status === "present" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {entry.status === "absent" && <XCircle className="h-3 w-3 mr-1" />}
                                {entry.status === "late" && <Clock className="h-3 w-3 mr-1" />}
                                {entry.status === "excused" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEditAttendance(entry.recordId, studentId, entry.status, entry.notes || '')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle>Homework Performance</CardTitle>
              <CardDescription>
                Complete homework submission history and grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold text-blue-600">{homeworkStats.totalAssignments}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold text-green-600">{homeworkStats.submittedAssignments}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Not Submitted</p>
                  <p className="text-2xl font-bold text-red-600">{homeworkStats.notSubmittedAssignments}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Late Submissions</p>
                  <p className="text-2xl font-bold text-yellow-600">{homeworkStats.lateSubmissions}</p>
                </div>
              </div>
              <div className="space-y-2">
                {homeworkSubmissions.map((submission) => {
                  const isOverdue = submission.status === 'not_submitted' && 
                    new Date(submission.assignment?.dueDate || '') < new Date()
                  const statusColor = {
                    'graded': 'bg-green-100 text-green-800',
                    'submitted': 'bg-blue-100 text-blue-800',
                    'late': 'bg-yellow-100 text-yellow-800',
                    'not_submitted': isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }[submission.status]

                  const statusText = {
                    'graded': 'Graded',
                    'submitted': 'Submitted',
                    'late': 'Late',
                    'not_submitted': isOverdue ? 'Overdue' : 'Not Submitted'
                  }[submission.status]

                  const isEditingThis = editingHomework === submission.id
                  
                  return (
                    <div key={submission.id} className="p-3 border rounded-lg">
                      {isEditingThis ? (
                        <div className="space-y-3">
                          {/* Title and cancel button on same row */}
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{submission.assignment?.title}</p>
                            <Button size="sm" variant="ghost" onClick={() => setEditingHomework(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Assignment info - Mobile-first responsive layout */}
                          <div className="space-y-3 sm:space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <span>Due: {new Date(submission.assignment?.dueDate || '').toLocaleDateString()}</span>
                              {submission.submittedDate && (
                                <span>Submitted: {new Date(submission.submittedDate).toLocaleDateString()}</span>
                              )}
                              <span className="truncate">Class: {data.classes.find(c => c.id === submission.assignment?.classId)?.name}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 sm:ml-auto">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Score"
                                  value={homeworkEditData.score}
                                  onChange={(e) => setHomeworkEditData({...homeworkEditData, score: parseInt(e.target.value) || 0})}
                                  className="w-20 text-foreground"
                                  min="0"
                                  max={submission.maxScore}
                                />
                                <span className="text-sm text-foreground">/{submission.maxScore}</span>
                              </div>
                              <Select 
                                value={homeworkEditData.status} 
                                onValueChange={(value) => setHomeworkEditData({...homeworkEditData, status: value})}
                              >
                                <SelectTrigger className="w-full sm:w-32 text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="graded">Graded</SelectItem>
                                  <SelectItem value="submitted">Submitted</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Feedback textarea */}
                          <div>
                            <Textarea
                              placeholder="Feedback..."
                              value={homeworkEditData.feedback}
                              onChange={(e) => setHomeworkEditData({...homeworkEditData, feedback: e.target.value})}
                              className="w-full min-h-[80px]"
                              rows={3}
                            />
                          </div>
                          
                          {/* Save button in bottom-right corner */}
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSaveHomework(submission.id)}>
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{submission.assignment?.title}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                              <span>Due: {new Date(submission.assignment?.dueDate || '').toLocaleDateString()}</span>
                              {submission.submittedDate && (
                                <span>Submitted: {new Date(submission.submittedDate).toLocaleDateString()}</span>
                              )}
                              <span className="truncate">Class: {data.classes.find(c => c.id === submission.assignment?.classId)?.name}</span>
                            </div>
                            {submission.feedback && (
                              <p className="text-sm text-muted-foreground mt-1 italic">"{submission.feedback}"</p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:text-right sm:items-center gap-2 sm:gap-3">
                            {submission.score !== undefined && (
                              <div className="flex items-center gap-2 sm:flex-col sm:gap-0">
                                <p className="font-bold">{submission.score}/{submission.maxScore}</p>
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  {submission.grade}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={statusColor}>
                                {statusText}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEditHomework(submission.id, submission.score || 0, submission.feedback || '', submission.status)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {homeworkSubmissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No homework assignments found for this student.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Complete test performance history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{testStats.passedTests}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{testStats.failedTests}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600">{testStats.averageScore}%</p>
                </div>
              </div>
              <div className="space-y-2">
                {testResults.map((result) => {
                  const percentage = Math.round((result.score / result.maxScore) * 100)
                  const passed = percentage >= 70
                  const isEditing = editingTestResult === result.id
                  
                  return (
                    <div key={result.id} className="p-3 border rounded-lg">
                      {isEditing ? (
                        <div className="space-y-3">
                          {/* Title and cancel button on same row */}
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{result.test?.title}</p>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTestResult(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Test info with score input */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Date: {new Date(result.submissionDate || result.createdDate).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2 ml-auto">
                              <Input
                                type="number"
                                placeholder="Score"
                                value={testResultEditData.score}
                                onChange={(e) => setTestResultEditData({...testResultEditData, score: parseInt(e.target.value) || 0})}
                                className="w-20 text-foreground"
                                min="0"
                                max={result.maxScore}
                              />
                              <span className="text-sm text-foreground">/{result.maxScore}</span>
                            </div>
                          </div>
                          
                          {/* Feedback textarea */}
                          <div>
                            <Textarea
                              placeholder="Feedback..."
                              value={testResultEditData.feedback}
                              onChange={(e) => setTestResultEditData({...testResultEditData, feedback: e.target.value})}
                              className="w-full min-h-[80px]"
                              rows={3}
                            />
                          </div>
                          
                          {/* Save button in bottom-right corner */}
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSaveTestResult(result.id)}>
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{result.test?.title}</p>
                              {result.attachedFile && (
                                <FileText className="h-3 w-3 text-blue-600" title="Has attached file" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.submissionDate || result.createdDate).toLocaleDateString()}
                            </p>
                            {result.feedback && (
                              <p className="text-sm text-muted-foreground italic mt-1">"{result.feedback}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-bold">{result.score}/{result.maxScore}</p>
                              <Badge variant={passed ? "default" : "destructive"} className={passed ? "bg-green-100 text-green-800" : ""}>
                                {result.grade} ({percentage}%)
                              </Badge>
                            </div>
                            {result.attachedFile && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewAttachedFile(result)}
                                className="h-8 w-8 p-0"
                                title="View attached file"
                              >
                                <FileText className="h-3 w-3 text-blue-600" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditTestResult(result.id, result.score, result.feedback || '')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
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
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>
                Current class enrollments and schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {enrolledClasses.map((classItem) => (
                  <Card key={classItem.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{classItem.name}</h3>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: classItem.color }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{classItem.subject}</p>
                      <p className="text-sm">{classItem.description}</p>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Room: {classItem.room}</p>
                        <p className="text-sm text-muted-foreground">
                          Students: {classItem.enrolledStudents.length}/{classItem.capacity}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Notes</CardTitle>
                  <CardDescription>
                    Teacher notes and observations
                  </CardDescription>
                </div>
                <Button onClick={() => setIsNoteDialogOpen(true)} aria-label="Add Note">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Add Note</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentNotes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{note.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm mb-3">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By: {note.createdBy}</span>
                        <span>{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {studentNotes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No notes available. Click "Add Note" to create the first note.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update student details and contact information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-grade">Grade</Label>
              <Select value={editFormData.grade} onValueChange={(value) => setEditFormData({ ...editFormData, grade: value })}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="edit-parent">Parent Contact</Label>
              <Input
                id="edit-parent"
                value={editFormData.parentContact}
                onChange={(e) => setEditFormData({ ...editFormData, parentContact: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Update Student</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Student Note</DialogTitle>
            <DialogDescription>
              Create a new note for this student.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="e.g., Academic Progress, Behavior Note"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Note Content</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Enter your note here..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Add Note</Button>
              <Button type="button" variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isFilePreviewOpen}
        onClose={() => {
          setIsFilePreviewOpen(false)
          setSelectedFile(null)
        }}
        file={selectedFile}
        title="Test Result File"
      />
    </div>
  )
}