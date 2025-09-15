import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Toast functionality removed - using console logging instead
import {
  ArrowLeft,
  FileText,
  Users,
  TrendingUp,
  Edit,
  BarChart3,
  PieChart,
  GraduationCap,
  Trophy,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  FileUp
} from "lucide-react"
import { useAppData } from "@/context/AppDataMigrationContext"
import { FilePreviewModal } from "@/components/common"

export default function TestDetails() {
  const { id: testId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data, actions } = useAppData()

  // URL parameter handling
  const tabFromUrl = searchParams.get('tab') || 'results'
  const focusFromUrl = searchParams.get('focus')

  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [isAddResultDialogOpen, setIsAddResultDialogOpen] = useState(false)
  const [isEditResultDialogOpen, setIsEditResultDialogOpen] = useState(false)
  const [editingResult, setEditingResult] = useState<any>(null)
  const [newResult, setNewResult] = useState({
    studentId: '',
    score: '',
    feedback: ''
  })
  const [editResult, setEditResult] = useState({
    score: '',
    feedback: ''
  })
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'file'>('manual')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isEditTestDialogOpen, setIsEditTestDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<any>(null)

  // Get test information
  const test = data.tests.find(t => t.id === testId)
  const classItem = test ? data.classes.find(c => c.id === test.classId) : null
  const testResults = data.testResults.filter(r => r.testId === testId)

  // Handle URL parameters
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }

    // If focus=files, scroll to the results table and show helpful toast
    if (focusFromUrl === 'files' && tabFromUrl === 'results') {
      setTimeout(() => {
        const resultsTable = document.querySelector('[data-testid="results-table"]')
        if (resultsTable) {
          resultsTable.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }

        // Show helpful toast
        const fileCount = testResults.filter(r => r.attachedFile).length
        if (fileCount > 0) {
          console.log(`ℹ️ Found ${fileCount} result${fileCount > 1 ? 's' : ''} with attached files. Click the blue file icons to view them.`)
        } else {
          console.log("ℹ️ No files found for this test.")
        }
      }, 500)
    }
  }, [tabFromUrl, focusFromUrl, testResults])

  if (!test) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tests')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1>Test not found</h1>
        </div>
      </div>
    )
  }

  // Get statistics
  const getTestStats = () => {
    const totalSubmissions = testResults.length
    const expectedSubmissions = classItem?.enrolledStudents.length || 0
    const submissionRate = expectedSubmissions > 0 ? (totalSubmissions / expectedSubmissions) * 100 : 0

    const averageScore = testResults.length > 0
      ? testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length
      : 0

    const highestScore = testResults.length > 0
      ? Math.max(...testResults.map(r => r.percentage))
      : 0

    const lowestScore = testResults.length > 0
      ? Math.min(...testResults.map(r => r.percentage))
      : 0

    const passRate = testResults.length > 0
      ? (testResults.filter(r => r.percentage >= 70).length / testResults.length) * 100
      : 0

    return {
      totalSubmissions,
      expectedSubmissions,
      submissionRate: Math.round(submissionRate),
      averageScore: Math.round(averageScore),
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      passRate: Math.round(passRate)
    }
  }

  // Get grade distribution
  const getGradeDistribution = () => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    testResults.forEach(result => {
      const percentage = result.percentage
      if (percentage >= 90) distribution.A++
      else if (percentage >= 80) distribution.B++
      else if (percentage >= 70) distribution.C++
      else if (percentage >= 60) distribution.D++
      else distribution.F++
    })
    return distribution
  }

  // Get results with student info
  const getResultsWithStudentInfo = () => {
    return testResults.map(result => {
      const student = data.students.find(s => s.id === result.studentId)
      return {
        ...result,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || ''
      }
    }).sort((a, b) => b.percentage - a.percentage)
  }

  // Handle adding new result
  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newResult.studentId || !newResult.score) {
      console.error("❌ Please fill in required fields")
      return
    }

    const score = parseInt(newResult.score)
    const percentage = Math.round((score / test.totalPoints) * 100)
    let grade = 'F'

    if (percentage >= 90) grade = 'A'
    else if (percentage >= 80) grade = 'B'
    else if (percentage >= 70) grade = 'C'
    else if (percentage >= 60) grade = 'D'

    const resultData = {
      testId: test.id,
      studentId: newResult.studentId,
      score: score,
      maxScore: test.totalPoints,
      percentage: percentage,
      grade: grade,
      feedback: newResult.feedback,
      gradedDate: new Date().toISOString().split('T')[0],
      attachedFile: null // Add this property to satisfy the required type
    }

    actions.addTestResult(resultData)
    setIsAddResultDialogOpen(false)
    setNewResult({
      studentId: '',
      score: '',
      feedback: ''
    })
    console.log("✅ Test result added successfully")
  }

  // Handle edit result
  const handleEditResult = (result: any) => {
    setEditingResult(result)
    setEditResult({
      score: result.score.toString(),
      feedback: result.feedback || ''
    })
    setUploadMethod('manual')
    setUploadedFile(null)
    setFilePreviewUrl('')
    setIsEditResultDialogOpen(true)
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)

    // Create preview URL for the file
    const previewUrl = URL.createObjectURL(file)
    setFilePreviewUrl(previewUrl)

    // Clear previous score since we can't auto-extract from images/PDFs
    setEditResult({
      ...editResult,
      score: ''
    })
  }

  // Check if file is an image
  const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
  }

  // Check if file is a PDF
  const isPDFFile = (file: File) => {
    return file.type === 'application/pdf'
  }

  // Handle update result
  const handleUpdateResult = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editResult.score) {
      console.error("❌ Please enter a score")
      return
    }

    if (uploadMethod === 'file' && !uploadedFile) {
      console.error("❌ Please upload a file")
      return
    }

    const score = parseInt(editResult.score.toString())
    const percentage = Math.round((score / test.totalPoints) * 100)
    let grade = 'F'

    if (percentage >= 90) grade = 'A'
    else if (percentage >= 80) grade = 'B'
    else if (percentage >= 70) grade = 'C'
    else if (percentage >= 60) grade = 'D'

    const updatedResult = {
      ...editingResult,
      score: score,
      percentage: percentage,
      grade: grade,
      feedback: editResult.feedback,
      gradedDate: new Date().toISOString().split('T')[0],
      // Store file information if uploaded
      ...(uploadedFile && {
        attachedFile: {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size,
          url: filePreviewUrl // In a real app, this would be a server URL
        }
      })
    }

    actions.updateTestResult(editingResult.id, updatedResult)

    // Clean up
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl)
    }

    setIsEditResultDialogOpen(false)
    setEditingResult(null)
    setEditResult({
      score: '',
      feedback: ''
    })
    setUploadMethod('manual')
    setUploadedFile(null)
    setFilePreviewUrl('')
    console.log("✅ Test result updated successfully")
  }

  // Handle view student
  const handleViewStudent = (studentId: string) => {
    navigate(`/students/${studentId}`)
  }

  // Handle view attached file
  const handleViewAttachedFile = (result: any) => {
    if (result.attachedFile?.url) {
      setSelectedFile(result.attachedFile)
      setIsFilePreviewOpen(true)
    } else {
      console.error("❌ File not available")
    }
  }

  // Handle delete result
  const handleDeleteResult = (resultId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete the result for ${studentName}?`)) {
      actions.deleteTestResult(resultId)
      console.log("✅ Test result deleted successfully")
    }
  }

  // Handle edit test
  const handleEditTest = () => {
    setEditingTest({
      id: test.id,
      title: test.title,
      description: test.description,
      classId: test.classId,
      totalPoints: test.totalPoints,
      testDate: test.testDate,
      testType: test.testType
    })
    setIsEditTestDialogOpen(true)
  }

  // Handle update test
  const handleUpdateTest = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTest.title || !editingTest.classId || !editingTest.testDate) {
      console.error("❌ Please fill in all required fields")
      return
    }

    actions.updateTest(editingTest.id, {
      title: editingTest.title,
      description: editingTest.description,
      classId: editingTest.classId,
      totalPoints: editingTest.totalPoints,
      testDate: editingTest.testDate,
      testType: editingTest.testType
    })

    setIsEditTestDialogOpen(false)
    setEditingTest(null)
    console.log("✅ Test updated successfully")
  }

  const stats = getTestStats()
  const gradeDistribution = getGradeDistribution()
  const resultsWithStudentInfo = getResultsWithStudentInfo()
  const enrolledStudents = classItem?.enrolledStudents || []
  const studentsWithoutResults = data.students.filter(student =>
    enrolledStudents.includes(student.id) &&
    !testResults.some(result => result.studentId === student.id)
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tests')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
            <p className="text-muted-foreground">
              {classItem?.name} • {new Date(test.testDate).toLocaleDateString()} • {test.totalPoints} points
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleEditTest}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Test
          </Button>

          <Dialog open={isAddResultDialogOpen} onOpenChange={setIsAddResultDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Result
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4" >
              <DialogHeader>
                <DialogTitle>Add Test Result</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddResult} className="space-y-4">
                <div>
                  <Label htmlFor="student">Student *</Label>
                  <Select value={newResult.studentId} onValueChange={(value) => setNewResult({ ...newResult, studentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsWithoutResults.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="score">Score (out of {test.totalPoints}) *</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newResult.score}
                    onChange={(e) => setNewResult({ ...newResult, score: e.target.value })}
                    min="0"
                    max={test.totalPoints}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={newResult.feedback}
                    onChange={(e) => setNewResult({ ...newResult, feedback: e.target.value })}
                    rows={3}
                    placeholder="Optional feedback for the student..."
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddResultDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Result</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Result Dialog */}
          <Dialog open={isEditResultDialogOpen} onOpenChange={setIsEditResultDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4" >
              <DialogHeader>
                <DialogTitle>Edit Test Result</DialogTitle>
              </DialogHeader>

              <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'manual' | 'file')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    File Upload
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleUpdateResult} className="space-y-4 mt-4">
                  <TabsContent value="manual" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="editScore">Score (out of {test.totalPoints}) *</Label>
                      <Input
                        id="editScore"
                        type="number"
                        value={editResult.score}
                        onChange={(e) => setEditResult({ ...editResult, score: e.target.value })}
                        min="0"
                        max={test.totalPoints}
                        required={uploadMethod === 'manual'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editFeedback">Feedback</Label>
                      <Textarea
                        id="editFeedback"
                        value={editResult.feedback}
                        onChange={(e) => setEditResult({ ...editResult, feedback: e.target.value })}
                        rows={3}
                        placeholder="Optional feedback for the student..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="fileUpload">Upload Test Result File *</Label>
                      <div className="mt-2">
                        <Input
                          id="fileUpload"
                          type="file"
                          onChange={handleFileUpload}
                          accept=".jpg,.jpeg,.png,.pdf"
                          required={uploadMethod === 'file'}
                          className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Supported formats: JPEG, PNG, PDF. Upload scanned test papers or graded documents.
                        </p>
                      </div>
                    </div>

                    {uploadedFile && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>

                        {/* File Preview */}
                        {isImageFile(uploadedFile) && filePreviewUrl && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Preview:</p>
                            <img
                              src={filePreviewUrl}
                              alt="Test result preview"
                              className="max-w-full max-h-48 object-contain border rounded-lg"
                            />
                          </div>
                        )}

                        {isPDFFile(uploadedFile) && (
                          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <span className="text-sm text-orange-700 dark:text-orange-300">
                                PDF file uploaded. You can view it after saving.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="fileScore">Score (out of {test.totalPoints}) *</Label>
                      <Input
                        id="fileScore"
                        type="number"
                        value={editResult.score}
                        onChange={(e) => setEditResult({ ...editResult, score: e.target.value })}
                        min="0"
                        max={test.totalPoints}
                        required={uploadMethod === 'file'}
                        placeholder="Enter the score from the uploaded file"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Please enter the score shown in the uploaded file.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="fileFeedback">Feedback</Label>
                      <Textarea
                        id="fileFeedback"
                        value={editResult.feedback}
                        onChange={(e) => setEditResult({ ...editResult, feedback: e.target.value })}
                        rows={3}
                        placeholder="Add feedback based on the uploaded file..."
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Supported File Types:</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>JPEG/PNG:</strong> Scanned or photographed test papers, graded assignments</p>
                        <p><strong>PDF:</strong> Digital test results, graded documents, score reports</p>
                        <p className="text-orange-600 dark:text-orange-400 mt-2">
                          ⚠️ Score must be entered manually as it cannot be automatically extracted from images/PDFs
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditResultDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Result</Button>
                  </DialogFooter>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Edit Test Dialog */}
          <Dialog open={isEditTestDialogOpen} onOpenChange={setIsEditTestDialogOpen}>
            <DialogContent className="max-w-2xl mx-4" >
              <DialogHeader>
                <DialogTitle>Edit Test</DialogTitle>
              </DialogHeader>
              {editingTest && (
                <form onSubmit={handleUpdateTest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-title">Test Title *</Label>
                      <Input
                        id="edit-title"
                        value={editingTest.title}
                        onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-class">Class *</Label>
                      <Select value={editingTest.classId} onValueChange={(value) => setEditingTest({ ...editingTest, classId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
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
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingTest.description}
                      onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-totalPoints">Total Points</Label>
                      <Input
                        id="edit-totalPoints"
                        type="number"
                        value={editingTest.totalPoints}
                        onChange={(e) => setEditingTest({ ...editingTest, totalPoints: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-testDate">Test Date *</Label>
                      <Input
                        id="edit-testDate"
                        type="date"
                        value={editingTest.testDate}
                        onChange={(e) => setEditingTest({ ...editingTest, testDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-testType">Test Type</Label>
                      <Select value={editingTest.testType} onValueChange={(value: any) => setEditingTest({ ...editingTest, testType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditTestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Test</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Test Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {test.testType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(test.testDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="font-medium">{test.totalPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-medium">{classItem?.name}</p>
            </div>
            {test.description && (
              <div className="col-span-full">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{test.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}/{stats.expectedSubmissions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={stats.submissionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.submissionRate}% submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={stats.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.passRate}%</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <Progress value={stats.passRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">70% or higher</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Range</p>
                <p className="text-2xl font-bold">{stats.lowestScore}% - {stats.highestScore}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="missing">Missing Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Individual student performance and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="results-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="cursor-default">Student</TableHead>
                      <TableHead className="cursor-default">Score</TableHead>
                      <TableHead className="cursor-default">Percentage</TableHead>
                      <TableHead className="cursor-default">Grade</TableHead>
                      <TableHead className="cursor-default">Graded Date</TableHead>
                      <TableHead className="cursor-default w-44">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultsWithStudentInfo.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{(result as any).studentName}</p>
                              {(result as any).attachedFile && (
                                <div className={`flex items-center gap-1 ${focusFromUrl === 'files' ? 'animate-pulse' : ''}`}>
                                  <FileText className="h-3 w-3 text-blue-600" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{(result as any).studentEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{result.score}/{result.maxScore}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{(result as any).percentage}%</span>
                            <div className={`w-2 h-2 rounded-full ${(result as any).percentage >= 90 ? 'bg-green-500' :
                              (result as any).percentage >= 80 ? 'bg-blue-500' :
                                (result as any).percentage >= 70 ? 'bg-yellow-500' :
                                  (result as any).percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                              }`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(result as any).percentage >= 70 ? "default" : "destructive"}>
                            {(result as any).grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date((result as any).gradedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewStudent((result as any).studentId)}
                              className="h-8 w-8 p-0"
                              title="View student details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(result as any).attachedFile && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewAttachedFile(result)}
                                className={`h-8 w-8 p-0 ${focusFromUrl === 'files' ? 'bg-blue-50 animate-pulse' : ''}`}
                                title="View attached file"
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditResult(result)}
                              className="h-8 w-8 p-0"
                              title="Edit result"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteResult(result.id, result.studentName)}
                              className="h-8 w-8 p-0"
                              title="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {resultsWithStudentInfo.length === 0 && (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No test results yet</p>
                  <p className="text-sm text-muted-foreground">Results will appear here once students submit their tests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(gradeDistribution).map(([grade, count]) => {
                    const percentage = testResults.length > 0 ? (count / testResults.length) * 100 : 0
                    const colors = {
                      A: 'bg-green-500',
                      B: 'bg-blue-500',
                      C: 'bg-yellow-500',
                      D: 'bg-orange-500',
                      F: 'bg-red-500'
                    }
                    return (
                      <div key={grade} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${colors[grade as keyof typeof colors]}`} />
                          <span>Grade {grade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count} students</span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${colors[grade as keyof typeof colors]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-12">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Highest Score</span>
                  <span className="font-bold text-green-600">{stats.highestScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lowest Score</span>
                  <span className="font-bold text-red-600">{stats.lowestScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className="font-bold">{stats.averageScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pass Rate (≥70%)</span>
                  <span className="font-bold text-blue-600">{stats.passRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Submission Rate</span>
                  <span className="font-bold">{stats.submissionRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Missing Submissions
              </CardTitle>
              <CardDescription>Students who haven't submitted their test yet</CardDescription>
            </CardHeader>
            <CardContent>
              {studentsWithoutResults.length > 0 ? (
                <div className="space-y-2">
                  {studentsWithoutResults.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Send Reminder
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="font-medium">All students have submitted!</p>
                  <p className="text-sm text-muted-foreground">Every enrolled student has a recorded result</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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