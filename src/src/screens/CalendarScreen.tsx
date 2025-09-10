import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function CalendarScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // 'week' or 'month'

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(date.getDate() - day)
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek)
      weekDate.setDate(startOfWeek.getDate() + i)
      weekDates.push(weekDate)
    }
    return weekDates
  }

  const getScheduleForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateString = date.toISOString().split('T')[0]
    
    // Get regular schedules for this day
    const daySchedules = data.schedules.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek
    ).map(schedule => {
      const classInfo = data.classes.find(cls => cls.id === schedule.classId)
      return {
        id: schedule.id,
        type: 'class',
        title: classInfo?.name || 'Unknown Class',
        subtitle: classInfo?.subject || '',
        time: `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`,
        location: schedule.location,
        color: '#007AFF'
      }
    })

    // Get meetings for this date
    const dayMeetings = data.meetings.filter(meeting => 
      meeting.date === dateString
    ).map(meeting => ({
      id: meeting.id,
      type: 'meeting',
      title: meeting.title,
      subtitle: meeting.description,
      time: formatTime(meeting.time),
      location: meeting.location,
      color: '#FF9500'
    }))

    // Get tests for this date
    const dayTests = data.tests.filter(test => 
      test.testDate === dateString
    ).map(test => {
      const classInfo = data.classes.find(cls => cls.id === test.classId)
      return {
        id: test.id,
        type: 'test',
        title: test.title,
        subtitle: classInfo?.name || 'Unknown Class',
        time: 'All Day',
        location: classInfo?.room || '',
        color: '#FF3B30'
      }
    })

    return [...daySchedules, ...dayMeetings, ...dayTests].sort((a, b) => {
      if (a.time === 'All Day') return -1
      if (b.time === 'All Day') return 1
      return a.time.localeCompare(b.time)
    })
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + (direction * 7))
    setSelectedDate(newDate)
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + direction)
    setSelectedDate(newDate)
  }

  const handleAddEvent = () => {
    Alert.alert(
      'Add Event',
      'Choose what type of event to add:',
      [
        { text: 'Class Schedule', onPress: () => Alert.alert('Add Class Schedule', 'This feature would open a form to add a class schedule.') },
        { text: 'Meeting', onPress: () => Alert.alert('Add Meeting', 'This feature would open a form to add a meeting.') },
        { text: 'Test', onPress: () => Alert.alert('Add Test', 'This feature would open a form to add a test.') },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate)
    
    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
            <Icon name="chevron-left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
            <Icon name="chevron-right" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          {weekDates.map((date, index) => {
            const events = getScheduleForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isSelected = date.toDateString() === selectedDate.toDateString()
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayColumn,
                  isSelected && styles.selectedDayColumn
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <View style={[
                  styles.dayHeader,
                  isToday && styles.todayHeader
                ]}>
                  <Text style={[
                    styles.dayName,
                    isToday && styles.todayText
                  ]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isToday && styles.todayText
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
                
                <ScrollView style={styles.dayEvents} showsVerticalScrollIndicator={false}>
                  {events.map((event) => (
                    <View key={`${event.type}-${event.id}`} style={[
                      styles.eventItem,
                      { borderLeftColor: event.color }
                    ]}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.eventTime} numberOfLines={1}>{event.time}</Text>
                      {event.location && (
                        <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderDayView = () => {
    const events = getScheduleForDate(selectedDate)
    
    return (
      <View style={styles.dayViewContainer}>
        <View style={styles.dayViewHeader}>
          <TouchableOpacity 
            onPress={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(selectedDate.getDate() - 1)
              setSelectedDate(newDate)
            }} 
            style={styles.navButton}
          >
            <Icon name="chevron-left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.dayViewTitle}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity 
            onPress={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(selectedDate.getDate() + 1)
              setSelectedDate(newDate)
            }} 
            style={styles.navButton}
          >
            <Icon name="chevron-right" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.dayEventsList} showsVerticalScrollIndicator={false}>
          {events.length > 0 ? events.map((event) => (
            <Card key={`${event.type}-${event.id}`} style={styles.eventCard}>
              <View style={styles.eventCardContent}>
                <View style={[styles.eventIndicator, { backgroundColor: event.color }]} />
                <View style={styles.eventDetails}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventCardTitle}>{event.title}</Text>
                    <Text style={styles.eventCardTime}>{event.time}</Text>
                  </View>
                  {event.subtitle && (
                    <Text style={styles.eventCardSubtitle}>{event.subtitle}</Text>
                  )}
                  {event.location && (
                    <View style={styles.locationRow}>
                      <Icon name="location-on" size={16} color="#6b7280" />
                      <Text style={styles.eventCardLocation}>{event.location}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )) : (
            <View style={styles.noEventsContainer}>
              <Icon name="event" size={64} color="#d1d5db" />
              <Text style={styles.noEventsTitle}>No events scheduled</Text>
              <Text style={styles.noEventsDescription}>
                You have no classes, meetings, or tests scheduled for this day.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerActions}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'week' && styles.activeToggle]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.toggleText, viewMode === 'week' && styles.activeToggleText]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'month' && styles.activeToggle]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.toggleText, viewMode === 'month' && styles.activeToggleText]}>
                Day
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            title="Add Event"
            onPress={handleAddEvent}
            size="small"
            style={styles.addButton}
          />
        </View>
      </View>

      {/* Calendar Content */}
      {viewMode === 'week' ? renderWeekView() : renderDayView()}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginRight: 12,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeToggleText: {
    color: '#fff',
  },
  addButton: {
    minWidth: 90,
  },
  
  // Week View Styles
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  navButton: {
    padding: 8,
  },
  daysScroll: {
    flex: 1,
  },
  dayColumn: {
    width: 120,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  selectedDayColumn: {
    backgroundColor: '#f0f9ff',
  },
  dayHeader: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  todayHeader: {
    backgroundColor: '#dbeafe',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  todayText: {
    color: '#1e40af',
  },
  dayEvents: {
    flex: 1,
    padding: 4,
  },
  eventItem: {
    backgroundColor: '#fff',
    marginBottom: 4,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 10,
    color: '#9ca3af',
  },
  
  // Day View Styles
  dayViewContainer: {
    flex: 1,
  },
  dayViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dayEventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 40,
  },
  eventDetails: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  eventCardTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  eventCardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCardLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
})