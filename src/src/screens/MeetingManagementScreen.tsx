import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function MeetingManagementScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const filteredMeetings = data.meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    const today = new Date()
    const meetingDate = new Date(meeting.date)
    
    switch (selectedFilter) {
      case 'today':
        return meetingDate.toDateString() === today.toDateString()
      case 'upcoming':
        return meetingDate >= today
      case 'past':
        return meetingDate < today
      case 'virtual':
        return meeting.type === 'virtual'
      case 'in-person':
        return meeting.type === 'in-person'
      default:
        return true
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const getMeetingStats = () => {
    const today = new Date()
    const todayMeetings = data.meetings.filter(meeting => 
      new Date(meeting.date).toDateString() === today.toDateString()
    )
    const upcomingMeetings = data.meetings.filter(meeting => 
      new Date(meeting.date) > today
    )
    const virtualMeetings = data.meetings.filter(meeting => 
      meeting.type === 'virtual'
    )

    return {
      total: data.meetings.length,
      today: todayMeetings.length,
      upcoming: upcomingMeetings.length,
      virtual: virtualMeetings.length
    }
  }

  const getAttendeeNames = (attendeeIds: string[]) => {
    return attendeeIds.map(id => {
      const student = data.students.find(s => s.id === id)
      return student ? student.name : 'Unknown'
    }).join(', ')
  }

  const handleAddMeeting = () => {
    Alert.alert(
      'Add New Meeting',
      'This feature would open a form to schedule a new meeting.',
      [{ text: 'OK' }]
    )
  }

  const handleEditMeeting = (meetingId: string) => {
    Alert.alert(
      'Edit Meeting',
      'This feature would open a form to edit the meeting.',
      [{ text: 'OK' }]
    )
  }

  const handleDeleteMeeting = (meetingId: string) => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you'd call actions.deleteMeeting(meetingId)
            Alert.alert('Success', 'Meeting deleted successfully')
          }
        }
      ]
    )
  }

  const handleJoinMeeting = (meeting: any) => {
    if (meeting.type === 'virtual') {
      Alert.alert(
        'Join Virtual Meeting',
        `This would open the virtual meeting link for "${meeting.title}"`,
        [{ text: 'OK' }]
      )
    } else {
      Alert.alert(
        'Meeting Location',
        `This meeting is at: ${meeting.location}`,
        [{ text: 'OK' }]
      )
    }
  }

  const getMeetingStatusColor = (meeting: any) => {
    const now = new Date()
    const meetingDate = new Date(meeting.date)
    const [hours, minutes] = meeting.time.split(':')
    const meetingDateTime = new Date(meetingDate)
    meetingDateTime.setHours(parseInt(hours), parseInt(minutes))
    
    const meetingEnd = new Date(meetingDateTime.getTime() + (meeting.duration * 60000))

    if (now >= meetingDateTime && now <= meetingEnd) {
      return '#34C759' // In progress - Green
    } else if (meetingDateTime > now) {
      return '#007AFF' // Upcoming - Blue
    } else {
      return '#6b7280' // Past - Gray
    }
  }

  const getMeetingStatusText = (meeting: any) => {
    const now = new Date()
    const meetingDate = new Date(meeting.date)
    const [hours, minutes] = meeting.time.split(':')
    const meetingDateTime = new Date(meetingDate)
    meetingDateTime.setHours(parseInt(hours), parseInt(minutes))
    
    const meetingEnd = new Date(meetingDateTime.getTime() + (meeting.duration * 60000))

    if (now >= meetingDateTime && now <= meetingEnd) {
      return 'In Progress'
    } else if (meetingDateTime > now) {
      const diffTime = meetingDateTime.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays === 0) return 'Today'
      return `In ${diffDays} days`
    } else {
      return 'Completed'
    }
  }

  const stats = getMeetingStats()

  const filters = [
    { id: 'all', title: 'All', count: stats.total },
    { id: 'today', title: 'Today', count: stats.today },
    { id: 'upcoming', title: 'Upcoming', count: stats.upcoming },
    { id: 'virtual', title: 'Virtual', count: stats.virtual },
    { id: 'in-person', title: 'In-Person', count: stats.total - stats.virtual },
  ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meetings</Text>
        <Button
          title="Schedule Meeting"
          onPress={handleAddMeeting}
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setSelectedFilter('all')}
          >
            <Icon name="event" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setSelectedFilter('today')}
          >
            <Icon name="today" size={24} color="#34C759" />
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setSelectedFilter('upcoming')}
          >
            <Icon name="schedule" size={24} color="#FF9500" />
            <Text style={styles.statValue}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setSelectedFilter('virtual')}
          >
            <Icon name="video-call" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.virtual}</Text>
            <Text style={styles.statLabel}>Virtual</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, selectedFilter === filter.id && styles.activeFilterChip]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterText, 
              selectedFilter === filter.id && styles.activeFilterText
            ]}>
              {filter.title} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search meetings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Meetings List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredMeetings.map((meeting) => {
          const statusColor = getMeetingStatusColor(meeting)
          const statusText = getMeetingStatusText(meeting)
          const attendeeNames = getAttendeeNames(meeting.attendees)

          return (
            <Card key={meeting.id} style={styles.meetingCard}>
              <View style={styles.meetingHeader}>
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  <Text style={styles.meetingDescription} numberOfLines={2}>
                    {meeting.description}
                  </Text>
                </View>
                <View style={styles.meetingStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusText}
                    </Text>
                  </View>
                  <View style={styles.typeIndicator}>
                    <Icon 
                      name={meeting.type === 'virtual' ? 'video-call' : 'location-on'} 
                      size={16} 
                      color="#6b7280" 
                    />
                    <Text style={styles.typeText}>
                      {meeting.type === 'virtual' ? 'Virtual' : 'In-Person'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.meetingDetails}>
                <View style={styles.detailRow}>
                  <Icon name="event" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {formatDate(meeting.date)} at {formatTime(meeting.time)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="schedule" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {meeting.duration} minutes
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon 
                    name={meeting.type === 'virtual' ? 'video-call' : 'location-on'} 
                    size={16} 
                    color="#6b7280" 
                  />
                  <Text style={styles.detailText}>{meeting.location}</Text>
                </View>
                {meeting.attendees.length > 0 && (
                  <View style={styles.detailRow}>
                    <Icon name="people" size={16} color="#6b7280" />
                    <Text style={styles.detailText} numberOfLines={2}>
                      {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}: {attendeeNames}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.meetingActions}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleJoinMeeting(meeting)}
                  >
                    <Icon 
                      name={meeting.type === 'virtual' ? 'video-call' : 'location-on'} 
                      size={16} 
                      color="#007AFF" 
                    />
                    <Text style={styles.actionButtonText}>
                      {meeting.type === 'virtual' ? 'Join' : 'Locate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditMeeting(meeting.id)}
                  >
                    <Icon name="edit" size={16} color="#6b7280" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteMeeting(meeting.id)}
                  >
                    <Icon name="delete" size={16} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )
        })}

        {filteredMeetings.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="event" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No meetings found' : 'No meetings scheduled'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 
                'Try adjusting your search terms or filter' : 
                'Schedule your first meeting to connect with students and parents'
              }
            </Text>
            {!searchQuery && (
              <Button
                title="Schedule Meeting"
                onPress={handleAddMeeting}
                style={styles.emptyButton}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    minWidth: 120,
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#dbeafe',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#1e40af',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#374151',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  meetingCard: {
    marginBottom: 16,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  meetingInfo: {
    flex: 1,
    marginRight: 12,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  meetingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  meetingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  meetingActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyButton: {
    minWidth: 140,
  },
})