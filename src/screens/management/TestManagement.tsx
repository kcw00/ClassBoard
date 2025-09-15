import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Toast functionality removed - using console logging instead
import {
  Plus,
  FileText,
  Clock,
  TrendingUp,
  Eye,
  Upload,
  Search,
  CheckCircle,
  Trash2
} from "lucide-react"
import { useAppData } from "@/context/AppDataMigrationContext"

export default function TestManagement() {
  const { data, actions } = useAppData()
  const navigate = useNavigate()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    classId: '',
    totalPoints: 100,
    testDate: '',
    testType: 'exam' as const
  })
  const [editingTest, setEditingTest] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Get test statistics
  const getTestStats = () => {
    const totalTests = data.tests.length
    const activeTests = data.tests.filter(test => new Date(test.testDate) > new Date()).length
    const completedTests = data.tests.filter(test => new Date(test.testDate) <= new Date()).length
    const totalResults = data.testResults.length

    const averageScore = totalResults > 0
      ? data.testResults.reduce((sum, result) => sum + result.percentage, 0) / totalResults
      : 0

    const passRate = totalResults > 0
      ? (data.testResults.filter(result => result.percentage >= 70).length / totalResults) * 100
      : 0

    return {
      totalTests,
      activeTests,
      completedTests,
      totalResults,
      averageScore: Math.round(averageScore),
      passRate: Math.round(passRate)
    }
  }

  // Get tests with additional info
  const getTestsWithInfo = () => {
    return data.tests.map(test => {
      const classItem = data.classes.find(c => c.id === test.classId)
      const results = data.testResults.filter(r => r.testId === test.id)
      const submissionCount = results.length
      const expectedSubmissions = classItem?.enrolledStudents.length || 0
      const averageScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
        : 0

      const isActive = new Date(test.testDate) > new Date()
      const isPastDue = new Date(test.testDate) <= new Date()
      const hasAttachedFiles = results.some(r => r.attachedFile)
      const attachedFilesCount = results.filter(r => r.attachedFile).length

      return {
        ...test,
        className: classItem?.name || 'Unknown Class',
        submissionCount,
        expectedSubmissions,
        averageScore: Math.round(averageScore),
        status: isPastDue ? 'completed' : 'active',
        isActive,
        isPastDue,
        hasAttachedFiles,
        attachedFilesCount
      }
    })
  }

  // Handle creating new test
  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTest.title || !newTest.classId || !newTest.testDate) {
      console.error("❌ Please fill in all required fields")
      return
    }

    const test = {
      title: newTest.title,
      description: newTest.description,
      classId: newTest.classId,
      totalPoints: newTest.totalPoints,
      testDate: newTest.testDate,
      testType: newTest.testType
    }

    actions.addTest(test)
    setIsCreateDialogOpen(false)
    setNewTest({
      title: '',
      description: '',
      classId: '',
      totalPoints: 100,
      testDate: '',
      testType: 'exam'
    })
    console.log("✅ Test created successfully")
  }

  // Handle editing test
  const handleEditTest = (test: any) => {
    setEditingTest({
      id: test.id,
      title: test.title,
      description: test.description,
      classId: test.classId,
      totalPoints: test.totalPoints,
      testDate: test.testDate,
      testType: test.testType
    })
    setIsEditDialogOpen(true)
  }

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

    setIsEditDialogOpen(false)
    setEditingTest(null)
    console.log("✅ Test updated successfully")
  }



  // Handle delete test
  const handleDeleteTest = (testId: string, testTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${testTitle}"? This will also delete all associated results.`)) {
      actions.deleteTest(testId)
      console.log("✅ Test deleted successfully")
    }
  }

  // Handle view test files - navigate to test details with focus on files
  const handleViewTestFiles = (testId: string) => {
    navigate(`/tests/${testId}?tab=results&focus=files`)
  }

  // Filter tests
  const filteredTests = getTestsWithInfo().filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = filterClass === "all" || test.classId === filterClass
    const matchesStatus = filterStatus === "all" || test.status === filterStatus

    return matchesSearch && matchesClass && matchesStatus
  })

  const stats = getTestStats()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground">Create, manage, and analyze test results</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" aria-label="Upload Test">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Upload Test</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] mx-4" >
              <DialogHeader>
                <DialogTitle>Upload Test File</DialogTitle>
                <DialogDescription>Upload a test file (PDF, DOC, etc.)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Test File</Label>
                  <Input id="file" type="file" accept=".pdf,.doc,.docx" />
                </div>
                <div>
                  <Label htmlFor="test-select">Associate with Test</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.tests.map(test => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} aria-label="Cancel">
                  <span>Cancel</span>
                </Button>
                <Button onClick={() => {
                  setIsUploadDialogOpen(false)
                  console.log("✅ Test file uploaded successfully")
                }} aria-label="Upload">
                  <span>Upload</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button aria-label="Create Test">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Create Test</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4" >
              <DialogHeader>
                <DialogTitle>Create New Test</DialogTitle>
                <DialogDescription>Set up a new test for your students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Test Title *</Label>
                    <Input
                      id="title"
                      value={newTest.title}
                      onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <Select value={newTest.classId} onValueChange={(value) => setNewTest({ ...newTest, classId: value })}>
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalPoints">Total Points</Label>
                    <Input
                      id="totalPoints"
                      type="number"
                      value={newTest.totalPoints}
                      onChange={(e) => setNewTest({ ...newTest, totalPoints: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testDate">Test Date *</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={newTest.testDate}
                      onChange={(e) => setNewTest({ ...newTest, testDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="testType">Test Type</Label>
                    <Select value={newTest.testType} onValueChange={(value: any) => setNewTest({ ...newTest, testType: value })}>
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
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} aria-label="Cancel">
                    <span>Cancel</span>
                  </Button>
                  <Button type="submit" aria-label="Create Test">
                    <span>Create Test</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Test Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl mx-4">
              <DialogHeader>
                <DialogTitle>Edit Test</DialogTitle>
                <DialogDescription>Update test information</DialogDescription>
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
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} aria-label="Cancel">
                      <span>Cancel</span>
                    </Button>
                    <Button type="submit" aria-label="Update Test">
                      <span>Update Test</span>
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{stats.totalTests}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tests</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeTests}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={stats.passRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {data.classes.map(classItem => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
          <CardDescription>Manage your tests and view submission statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-foreground font-medium cursor-default">Test Name</TableHead>
                  <TableHead className="text-foreground font-medium w-24 cursor-default">Class</TableHead>
                  <TableHead className="text-foreground font-medium w-28 cursor-default">Test Date</TableHead>
                  <TableHead className="text-foreground font-medium w-24 cursor-default">Status</TableHead>
                  <TableHead className="text-foreground font-medium w-32 cursor-default">Submissions</TableHead>
                  <TableHead className="text-foreground font-medium w-24 cursor-default">Avg Score</TableHead>
                  <TableHead className="text-foreground font-medium w-36 cursor-default">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{test.title}</p>
                          {test.hasAttachedFiles && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-600">({test.attachedFilesCount})</span>
                            </div>
                          )}
                        </div>
                        {test.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {test.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <span className="truncate block" title={test.className}>
                        {test.className}
                      </span>
                    </TableCell>
                    <TableCell className="w-28">{new Date(test.testDate).toLocaleDateString()}</TableCell>
                    <TableCell className="w-24">
                      <Badge variant={test.isActive ? "default" : "secondary"}>
                        {test.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{test.submissionCount}/{test.expectedSubmissions}</span>
                        <Progress
                          value={test.expectedSubmissions > 0 ? (test.submissionCount / test.expectedSubmissions) * 100 : 0}
                          className="w-12 h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{test.averageScore}%</span>
                        {test.submissionCount > 0 && (
                          <div className={`w-2 h-2 rounded-full ${test.averageScore >= 80 ? 'bg-green-500' :
                            test.averageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/tests/${test.id}`)}
                          className="h-8 w-8 p-0"
                          aria-label="View test details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTest(test.id, test.title)}
                          className="h-8 w-8 p-0"
                          aria-label="Delete test"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredTests.map((test) => (
              <div key={test.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{test.title}</h4>
                      {test.hasAttachedFiles && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600">({test.attachedFilesCount})</span>
                        </div>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {test.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{test.className}</span>
                      <span>{new Date(test.testDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={test.isActive ? "default" : "secondary"} className="ml-2">
                    {test.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Submissions: </span>
                      <span>{test.submissionCount}/{test.expectedSubmissions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="text-muted-foreground">Avg: </span>
                        {test.averageScore}%
                      </span>
                      {test.submissionCount > 0 && (
                        <div className={`w-2 h-2 rounded-full ${test.averageScore >= 80 ? 'bg-green-500' :
                          test.averageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/tests/${test.id}`)}
                      className="h-8 w-8 p-0"
                      aria-label="View test details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTest(test.id, test.title)}
                      className="h-8 w-8 p-0"
                      aria-label="Delete test"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Progress
                  value={test.expectedSubmissions > 0 ? (test.submissionCount / test.expectedSubmissions) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tests found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}