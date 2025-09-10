import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { VisuallyHidden } from "./ui/visually-hidden"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Checkbox } from "./ui/checkbox"
import { Plus, Users, MapPin, Clock, Settings, UserPlus, CalendarPlus, Trash2, Edit } from "lucide-react"
import { classColors } from "./mockData"
import { useAppData } from "../src/context/AppDataContext"

export default function ClassManagement() {
  const navigate = useNavigate()
  const { data, actions } = useAppData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.addClass({
      name: formData.name,
      subject: formData.subject,
      description: formData.description,
      room: formData.room,
      capacity: formData.capacity,
      color: formData.color
    })
    setFormData({ name: "", subject: "", description: "", room: "", capacity: "", color: "#3b82f6" })
    setIsDialogOpen(false)
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return
    
    actions.updateClass(selectedClass.id, {
      name: editFormData.name,
      subject: editFormData.subject,
      description: editFormData.description,
      room: editFormData.room,
      capacity: parseInt(editFormData.capacity),
      color: editFormData.color
    })
    setIsManageDialogOpen(false)
    setSelectedClass(null)
  }

  const handleEnrollStudent = (studentId: string, enrolled: boolean) => {
    if (!selectedClass) return
    
    if (enrolled) {
      actions.enrollStudent(selectedClass.id, studentId)
    } else {
      actions.unenrollStudent(selectedClass.id, studentId)
    }
  }

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return
    
    actions.addSchedule({
      classId: selectedClass.id,
      dayOfWeek: scheduleFormData.dayOfWeek,
      startTime: scheduleFormData.startTime,
      endTime: scheduleFormData.endTime
    })
    setScheduleFormData({ dayOfWeek: "", startTime: "", endTime: "" })
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    actions.deleteSchedule(scheduleId)
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            Manage your classes and enrollments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Add Class">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Add Class</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
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
                      className={`w-8 h-8 rounded-lg border-2 ${
                        formData.color === colorOption.value ? 'border-foreground' : 'border-border'
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
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto" aria-describedby={undefined}>
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
                            className={`w-8 h-8 rounded-lg border-2 ${
                              editFormData.color === colorOption.value ? 'border-foreground' : 'border-border'
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
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}