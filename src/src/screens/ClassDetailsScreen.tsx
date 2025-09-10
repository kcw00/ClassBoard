import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function ClassDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [activeTab, setActiveTab] = useState('overview')
  
  const { classId } = route.params as { classId: string }
  const classItem = data.classes.find(c => c.id === classId)

  if (!classItem) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Class not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    )
  }

  const enrolledStudents = data.students.filter(student => 
    classItem.enrolledStudents.includes(student.id)
  )

  const classSchedules = data.schedules.filter(schedule => 
    schedule.classId === classId
  )

  const classNotes = data.classNotes.filter(note => 
    note.classId === classId
  )

  const classTests = data.tests.filter(test => 
    test.classId === classId
  )

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'info' },
    { id: 'students', title: 'Students', icon: 'people' },
    { id: 'schedule', title: 'Schedule', icon: 'schedule' },
    { id: 'notes', title: 'Notes', icon: 'note' },
    { id: 'tests', title: 'Tests', icon: 'assignment' },
  ]

  const handleEnroll = () => {
    Alert.alert(
      'Enroll Student',
      'This feature would show a list of available students to enroll.',
      [{ text: 'OK' }]
    )
  }

  const handleAddSchedule = () => {
    Alert.alert(
      'Add Schedule',
      'This feature would open a form to add a new schedule.',
      [{ text: 'OK' }]
    )
  }

  const renderOverview = () => (
    <View>
      <Card style={styles.overviewCard}>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subject:</Text>
            <Text style={styles.infoValue}>{classItem.subject}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instructor:</Text>
            <Text style={styles.infoValue}>{classItem.instructor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room:</Text>
            <Text style={styles.infoValue}>{classItem.room}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Capacity:</Text>
            <Text style={styles.infoValue}>{classItem.capacity} students</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Enrolled:</Text>
            <Text style={styles.infoValue}>{enrolledStudents.length} students</Text>
          </View>
          {classItem.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{classItem.description}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="people" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{enrolledStudents.length}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="assignment" size={24} color="#34C759" />
            <Text style={styles.statValue}>{classTests.length}</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="note" size={24} color="#FF9500" />
            <Text style={styles.statValue}>{classNotes.length}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
        </Card>
      </View>
    </View>
  )

  const renderStudents = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Enrolled Students</Text>
        <Button
          title="Enroll"
          onPress={handleEnroll}
          size="small"
        />
      </View>
      
      {enrolledStudents.map((student) => (
        <Card key={student.id} style={styles.studentCard}>
          <View style={styles.studentContent}>
            <View style={styles.studentAvatar}>
              <Icon name="person" size={24} color="#007AFF" />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentEmail}>{student.email}</Text>
              <Text style={styles.studentPhone}>{student.phone}</Text>
            </View>
            <TouchableOpacity style={styles.studentAction}>
              <Icon name="chevron-right" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {enrolledStudents.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="people-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No students enrolled</Text>
          <Text style={styles.emptyDescription}>Add students to this class to get started</Text>
          <Button
            title="Enroll Students"
            onPress={handleEnroll}
            style={styles.emptyButton}
          />
        </View>
      )}
    </View>
  )

  const renderSchedule = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Class Schedule</Text>
        <Button
          title="Add"
          onPress={handleAddSchedule}
          size="small"
        />
      </View>

      {classSchedules.map((schedule) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return (
          <Card key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleDay}>
                <Text style={styles.scheduleDayText}>{days[schedule.dayOfWeek]}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleTime}>
                  {schedule.startTime} - {schedule.endTime}
                </Text>
                <Text style={styles.scheduleLocation}>{schedule.location}</Text>
              </View>
            </View>
          </Card>
        )
      })}

      {classSchedules.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="schedule" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No schedule set</Text>
          <Text style={styles.emptyDescription}>Add class times to help students know when to attend</Text>
          <Button
            title="Add Schedule"
            onPress={handleAddSchedule}
            style={styles.emptyButton}
          />
        </View>
      )}
    </View>
  )

  const renderNotes = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Class Notes</Text>
        <Button
          title="Add Note"
          onPress={() => Alert.alert('Add Note', 'This feature would open a form to add a new note.')}
          size="small"
        />
      </View>

      {classNotes.map((note) => (
        <Card key={note.id} style={styles.noteCard}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteDate}>{note.date}</Text>
          <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
          {note.topics.length > 0 && (
            <View style={styles.topicsContainer}>
              {note.topics.map((topic, index) => (
                <View key={index} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}

      {classNotes.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="note" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptyDescription}>Add notes to keep track of class content and activities</Text>
        </View>
      )}
    </View>
  )

  const renderTests = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tests & Assessments</Text>
        <Button
          title="Add Test"
          onPress={() => Alert.alert('Add Test', 'This feature would open a form to add a new test.')}
          size="small"
        />
      </View>

      {classTests.map((test) => (
        <Card key={test.id} style={styles.testCard}>
          <View style={styles.testHeader}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <Text style={styles.testPoints}>{test.totalPoints} pts</Text>
          </View>
          <Text style={styles.testDate}>{test.testDate}</Text>
          <Text style={styles.testType}>{test.testType}</Text>
          {test.description && (
            <Text style={styles.testDescription}>{test.description}</Text>
          )}
        </Card>
      ))}

      {classTests.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="assignment" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No tests created</Text>
          <Text style={styles.emptyDescription}>Create tests to assess student progress</Text>
        </View>
      )}
    </View>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'students':
        return renderStudents()
      case 'schedule':
        return renderSchedule()
      case 'notes':
        return renderNotes()
      case 'tests':
        return renderTests()
      default:
        return renderOverview()
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{classItem.name}</Text>
        <Text style={styles.headerSubtitle}>{classItem.subject}</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#007AFF' : '#6b7280'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#dbeafe',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  studentCard: {
    marginBottom: 12,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  studentPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  studentAction: {
    padding: 8,
  },
  scheduleCard: {
    marginBottom: 12,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDay: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  scheduleDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  scheduleLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 12,
    color: '#374151',
  },
  testCard: {
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  testPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  testDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  testType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 16,
  },
  errorButton: {
    minWidth: 120,
  },
})