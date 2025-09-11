import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { VisuallyHidden } from "../../components/ui/visually-hidden"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Mail, Phone, User, Users, ChevronUp, ChevronDown, Search } from "lucide-react"
import { useAppData } from "../../context/AppDataContext"

export default function StudentManagement() {
  const navigate = useNavigate()
  const { data, actions } = useAppData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    parentContact: ""
  })
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    grade: "",
    parentContact: "",
    enrollmentDate: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addStudent({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      grade: formData.grade,
      parentContact: formData.parentContact
    })
    setFormData({ name: "", email: "", phone: "", grade: "", parentContact: "" })
    setIsDialogOpen(false)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.updateStudent(editFormData.id, {
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      grade: editFormData.grade,
      parentContact: editFormData.parentContact
    })
    setIsEditDialogOpen(false)
    setEditingStudent(null)
    setEditFormData({ id: "", name: "", email: "", phone: "", grade: "", parentContact: "", enrollmentDate: "" })
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setEditFormData({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      parentContact: student.parentContact,
      enrollmentDate: student.enrollmentDate
    })
    setIsEditDialogOpen(true)
  }

  const getStudentClasses = (studentId: string) => {
    return data.classes.filter(classItem => 
      classItem.enrolledStudents.includes(studentId)
    )
  }

  const handleSortByFirstName = () => {
    if (sortOrder === null || sortOrder === "desc") {
      setSortOrder("asc")
    } else {
      setSortOrder("desc")
    }
  }

  const getFilteredAndSortedStudents = () => {
    // First filter by search query
    let filteredStudents = data.students.filter((student) => {
      const query = searchQuery.toLowerCase()
      return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.grade.toLowerCase().includes(query) ||
        student.phone.includes(query) ||
        student.parentContact.includes(query)
      )
    })

    // Then sort if we're in table view and have a sort order
    if (viewMode === "table" && sortOrder !== null) {
      filteredStudents = [...filteredStudents].sort((a, b) => {
        const firstNameA = a.name.split(' ')[0].toLowerCase()
        const firstNameB = b.name.split(' ')[0].toLowerCase()
        
        if (sortOrder === "asc") {
          return firstNameA.localeCompare(firstNameB)
        } else {
          return firstNameB.localeCompare(firstNameA)
        }
      })
    }

    return filteredStudents
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student roster and contact information
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(value: "cards" | "table") => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button aria-label="Add Student">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Add Student</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
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
                    <Label htmlFor="parentContact">Parent Contact</Label>
                    <Input
                      id="parentContact"
                      value={formData.parentContact}
                      onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                      placeholder="(555) 123-4568"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Student</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Students Content */}
      <div className="space-y-4">
        {viewMode === "cards" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {getFilteredAndSortedStudents().map((student) => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <Badge variant="secondary">{student.grade}</Badge>
                  </div>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      {student.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      {student.phone}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {getStudentClasses(student.id).length} classes
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStudent(student)
                      }}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Roster</CardTitle>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleSortByFirstName}
                  className="flex items-center gap-2"
                >
                  First Name
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : sortOrder === "desc" ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : null}
                </Button>
              </div>
              <CardDescription>
                Complete list of enrolled students with contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedStudents().map((student) => (
                    <TableRow 
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.grade}</Badge>
                      </TableCell>
                      <TableCell>{getStudentClasses(student.id).length}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditStudent(student)
                          }}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., John Smith"
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
                placeholder="student@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-grade">Grade</Label>
              <Select value={editFormData.grade} onValueChange={(value) => setEditFormData({ ...editFormData, grade: value })}>
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
              <Label htmlFor="edit-parentContact">Parent Contact</Label>
              <Input
                id="edit-parentContact"
                value={editFormData.parentContact}
                onChange={(e) => setEditFormData({ ...editFormData, parentContact: e.target.value })}
                placeholder="(555) 123-4568"
                required
              />
            </div>
            <Button type="submit" className="w-full">Update Student</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}