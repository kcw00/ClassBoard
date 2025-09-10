import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { VisuallyHidden } from "./ui/visually-hidden"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ScrollArea } from "./ui/scroll-area"
import { useAppData } from "../src/context/AppDataContext"
import { CalendarDays, Clock, MapPin, Users, Edit, Check, X, Plus, FileText } from "lucide-react"
import { toast } from "sonner@2.0.3"

export default function MeetingManagement() {
  const { data, actions } = useAppData()
  
  // State for dialogs and forms
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Form state for new meeting
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    participantType: 'parents' as 'students' | 'parents' | 'teachers',
    participants: [] as string[],
    location: '',
    meetingType: 'in-person' as 'in-person' | 'virtual',
    notes: ''
  })

  // Form state for editing meeting
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    participantType: 'parents' as 'students' | 'parents' | 'teachers',
    participants: [] as string[],
    location: '',
    meetingType: 'in-person' as 'in-person' | 'virtual',
    notes: ''
  })

  // Get today's date for upcoming meetings
  const today = new Date().toISOString().split('T')[0]

  // Filter meetings
  const upcomingMeetings = useMemo(() => {
    return data.meetings.filter(meeting => 
      meeting.date >= today && meeting.status === 'scheduled'
    ).sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime())
  }, [data.meetings, today])

  const filteredMeetings = useMemo(() => {
    let meetings = data.meetings
    if (activeTab !== 'all') {
      meetings = meetings.filter(meeting => meeting.status === activeTab)
    }
    return meetings.sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime())
  }, [data.meetings, activeTab])

  // Get participant options based on type
  const getParticipantOptions = (type: string) => {
    if (type === 'students') {
      return data.students.map(student => ({ id: student.id, name: student.name }))
    } else if (type === 'parents') {
      return data.students.map(student => ({ id: student.id, name: `${student.name} (Parent)` }))
    }
    return []
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Get student name by ID
  const getStudentName = (studentId: string) => {
    const student = data.students.find(s => s.id === studentId)
    return student ? student.name : studentId
  }

  // Handle schedule meeting
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMeeting.title || !newMeeting.date || !newMeeting.startTime || !newMeeting.endTime || !newMeeting.location) {
      toast.error("Please fill in all required fields")
      return
    }

    const meetingData = {
      ...newMeeting,
      status: 'scheduled' as const
    }

    actions.addMeeting(meetingData)
    setIsScheduleDialogOpen(false)
    setNewMeeting({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      participantType: 'parents',
      participants: [],
      location: '',
      meetingType: 'in-person',
      notes: ''
    })
    toast.success("Meeting scheduled successfully")
  }

  // Handle edit meeting
  const handleEditMeeting = (meeting: any) => {
    setEditingMeeting(meeting)
    setEditForm({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      participantType: meeting.participantType,
      participants: meeting.participants,
      location: meeting.location,
      meetingType: meeting.meetingType,
      notes: meeting.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  // Handle update meeting
  const handleUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editForm.title || !editForm.date || !editForm.startTime || !editForm.endTime || !editForm.location) {
      toast.error("Please fill in all required fields")
      return
    }

    actions.updateMeeting(editingMeeting.id, editForm)
    setIsEditDialogOpen(false)
    setEditingMeeting(null)
    toast.success("Meeting updated successfully")
  }

  // Handle mark complete
  const handleMarkComplete = (meetingId: string) => {
    actions.updateMeeting(meetingId, { status: 'completed' })
    toast.success("Meeting marked as completed")
  }

  // Handle delete meeting
  const handleDeleteMeeting = (meetingId: string, meetingTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${meetingTitle}"?`)) {
      actions.deleteMeeting(meetingId)
      toast.success("Meeting deleted successfully")
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage meetings with students, parents, and colleagues</p>
        </div>
        
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Schedule Meeting">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Schedule Meeting</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="participantType">Participant Type *</Label>
                  <Select value={newMeeting.participantType} onValueChange={(value: any) => setNewMeeting({...newMeeting, participantType: value, participants: []})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                    placeholder="e.g., Conference Room A, Virtual Meeting"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="meetingType">Meeting Type</Label>
                  <Select value={newMeeting.meetingType} onValueChange={(value: any) => setNewMeeting({...newMeeting, meetingType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting({...newMeeting, notes: e.target.value})}
                  rows={2}
                  placeholder="Additional notes or agenda items..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)} aria-label="Cancel">
                  <span>Cancel</span>
                </Button>
                <Button type="submit" aria-label="Schedule Meeting">
                  <span>Schedule Meeting</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
          <CardDescription>Your next scheduled meetings</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming meetings scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{meeting.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            <span>{formatDate(meeting.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{meeting.participantType}</span>
                      <span className="sm:hidden">{meeting.participantType.charAt(0).toUpperCase()}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>All Meetings</CardTitle>
          <CardDescription>View and manage all your meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="sticky top-0 bg-background z-10 pb-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" className="whitespace-nowrap">All</TabsTrigger>
                <TabsTrigger value="scheduled" className="whitespace-nowrap">Scheduled</TabsTrigger>
                <TabsTrigger value="completed" className="whitespace-nowrap">Completed</TabsTrigger>
                <TabsTrigger value="cancelled" className="whitespace-nowrap">Cancelled</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No meetings found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMeetings.map((meeting) => (
                    <div key={meeting.id} className="border rounded-lg p-4 space-y-4">
                      {/* Header with title and badges */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-lg flex-1 min-w-0 pr-2">{meeting.title}</h4>
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            <Badge variant={meeting.status === 'scheduled' ? 'default' : meeting.status === 'completed' ? 'secondary' : 'destructive'} className="text-xs">
                              {meeting.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">{meeting.participantType}</span>
                              <span className="sm:hidden">{meeting.participantType.charAt(0).toUpperCase()}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{meeting.description}</p>
                        )}
                      </div>
                      
                      {/* Meeting details */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{formatDate(meeting.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{meeting.location}</span>
                          </div>
                        </div>

                        {meeting.participants.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-foreground">Participants: </span>
                            <span className="text-muted-foreground">
                              {meeting.participantType === 'students' 
                                ? meeting.participants.map(id => getStudentName(id)).join(', ')
                                : meeting.participants.join(', ')
                              }
                            </span>
                          </div>
                        )}

                        {meeting.notes && (
                          <div className="text-sm">
                            <span className="font-medium text-foreground">Notes: </span>
                            <span className="text-muted-foreground">{meeting.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMeeting(meeting)}
                          aria-label="Edit meeting"
                        >
                          <Edit className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        
                        {meeting.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkComplete(meeting.id)}
                            className="whitespace-nowrap"
                            aria-label="Mark as complete"
                          >
                            <Check className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Mark Complete</span>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete meeting"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Meeting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-meeting-description">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription id="edit-meeting-description">Update meeting information</DialogDescription>
          </DialogHeader>
          {editingMeeting && (
            <form onSubmit={handleUpdateMeeting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Meeting Title *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-participantType">Participant Type *</Label>
                  <Select value={editForm.participantType} onValueChange={(value: any) => setEditForm({...editForm, participantType: value, participants: []})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-startTime">Start Time *</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End Time *</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-location">Location *</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-meetingType">Meeting Type</Label>
                  <Select value={editForm.meetingType} onValueChange={(value: any) => setEditForm({...editForm, meetingType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} aria-label="Cancel">
                  <span>Cancel</span>
                </Button>
                <Button type="submit" aria-label="Update Meeting">
                  <span>Update Meeting</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}