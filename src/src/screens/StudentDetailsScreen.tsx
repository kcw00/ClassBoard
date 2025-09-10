import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function StudentDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [activeTab, setActiveTab] = useState('overview')
  
  const { studentId } = route.params as { studentId: string }
  const student = data.students.find(s => s.id === studentId)

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Student not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    )
  }

  const enrolledClasses = data.classes.filter(cls => 
    cls.enrolledStudents.includes(studentId)
  )

  const attendanceRecords = data.attendanceRecords.filter(record =>
    record.attendanceData.some(entry => entry.studentId === studentId)
  )

  const testResults = data.testResults.filter(result => 
    result.studentId === studentId
  )

  const homeworkSubmissions = data.homeworkSubmissions.filter(submission => 
    submission.studentId === studentId
  )

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'info' },
    { id: 'classes', title: 'Classes', icon: 'school' },
    { id: 'attendance', title: 'Attendance', icon: 'check-circle' },
    { id: 'grades', title: 'Grades', icon: 'grade' },
    { id: 'homework', title: 'Homework', icon: 'assignment' },
  ]

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)
  }

  const handleEdit = () => {
    Alert.alert(
      'Edit Student',
      'This feature would open a form to edit student information.',
      [{ text: 'OK' }]
    )
  }

  const calculateAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 0
    
    const totalRecords = attendanceRecords.reduce((total, record) => {
      const studentRecord = record.attendanceData.find(entry => entry.studentId === studentId)
      return studentRecord ? total + 1 : total
    }, 0)

    const presentRecords = attendanceRecords.reduce((total, record) => {
      const studentRecord = record.attendanceData.find(entry => entry.studentId === studentId)
      return studentRecord && studentRecord.status === 'present' ? total + 1 : total
    }, 0)

    return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
  }

  const calculateAverageGrade = () => {
    if (testResults.length === 0) return null
    
    const totalPercentage = testResults.reduce((sum, result) => sum + result.percentage, 0)
    return Math.round(totalPercentage / testResults.length)
  }

  const renderOverview = () => (
    <View>
      <Card style={styles.contactCard}>
        <CardHeader>
          <View style={styles.contactHeader}>
            <CardTitle>Contact Information</CardTitle>
            <Button
              title="Edit"
              onPress={handleEdit}
              variant="outline"
              size="small"
            />
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.contactRow}>
            <Icon name="email" size={20} color="#007AFF" />
            <TouchableOpacity onPress={() => handleEmail(student.email)} style={styles.contactInfo}>
              <Text style={styles.contactValue}>{student.email}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <Icon name="phone" size={20} color="#007AFF" />
            <TouchableOpacity onPress={() => handleCall(student.phone)} style={styles.contactInfo}>
              <Text style={styles.contactValue}>{student.phone}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <Icon name="cake" size={20} color="#6b7280" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactValue}>{student.dateOfBirth}</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <Icon name="location-on" size={20} color="#6b7280" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactValue}>{student.address}</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <Icon name="contact-emergency" size={20} color="#FF9500" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Emergency Contact:</Text>
              <Text style={styles.contactValue}>{student.emergencyContact}</Text>
            </View>
          </View>
          {student.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{student.notes}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="school" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{enrolledClasses.length}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="check-circle" size={24} color="#34C759" />
            <Text style={styles.statValue}>{calculateAttendanceRate()}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="grade" size={24} color="#FF9500" />
            <Text style={styles.statValue}>
              {calculateAverageGrade() !== null ? `${calculateAverageGrade()}%` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
        </Card>
      </View>
    </View>
  )

  const renderClasses = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Enrolled Classes</Text>
      </View>
      
      {enrolledClasses.map((cls) => (
        <Card key={cls.id} style={styles.classCard}>
          <View style={styles.classHeader}>
            <Text style={styles.className}>{cls.name}</Text>
            <Text style={styles.classSubject}>{cls.subject}</Text>
          </View>
          <View style={styles.classDetails}>
            <View style={styles.detailRow}>
              <Icon name="person" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{cls.instructor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="room" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{cls.room}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="schedule" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{cls.schedule}</Text>
            </View>
          </View>
        </Card>
      ))}

      {enrolledClasses.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="school" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No classes enrolled</Text>
          <Text style={styles.emptyDescription}>This student is not enrolled in any classes</Text>
        </View>
      )}
    </View>
  )

  const renderAttendance = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Attendance History</Text>
        <Text style={styles.attendanceRate}>{calculateAttendanceRate()}% Present</Text>
      </View>

      {attendanceRecords.map((record) => {
        const studentRecord = record.attendanceData.find(entry => entry.studentId === studentId)
        if (!studentRecord) return null

        const classInfo = data.classes.find(cls => cls.id === record.classId)
        const statusColors = {
          present: '#34C759',
          absent: '#FF3B30',
          late: '#FF9500',
          excused: '#007AFF'
        }

        return (
          <Card key={record.id} style={styles.attendanceCard}>
            <View style={styles.attendanceHeader}>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceClass}>{classInfo?.name || 'Unknown Class'}</Text>
                <Text style={styles.attendanceDate}>{record.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColors[studentRecord.status]}20` }]}>
                <Text style={[styles.statusText, { color: statusColors[studentRecord.status] }]}>
                  {studentRecord.status.charAt(0).toUpperCase() + studentRecord.status.slice(1)}
                </Text>
              </View>
            </View>
            {studentRecord.notes && (
              <Text style={styles.attendanceNotes}>{studentRecord.notes}</Text>
            )}
          </Card>
        )
      })}

      {attendanceRecords.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No attendance records</Text>
          <Text style={styles.emptyDescription}>Attendance has not been recorded for this student</Text>
        </View>
      )}
    </View>
  )

  const renderGrades = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <Text style={styles.averageGrade}>
          Avg: {calculateAverageGrade() !== null ? `${calculateAverageGrade()}%` : 'N/A'}
        </Text>
      </View>

      {testResults.map((result) => {
        const test = data.tests.find(t => t.id === result.testId)
        const classInfo = data.classes.find(cls => cls.id === test?.classId)

        return (
          <Card key={result.id} style={styles.gradeCard}>
            <View style={styles.gradeHeader}>
              <View style={styles.gradeInfo}>
                <Text style={styles.testTitle}>{test?.title || 'Unknown Test'}</Text>
                <Text style={styles.testClass}>{classInfo?.name || 'Unknown Class'}</Text>
                <Text style={styles.testDate}>{result.gradedDate}</Text>
              </View>
              <View style={styles.gradeScore}>
                <Text style={styles.scoreText}>{result.score}/{result.maxScore}</Text>
                <Text style={styles.percentageText}>{result.percentage}%</Text>
                <Text style={styles.gradeText}>{result.grade}</Text>
              </View>
            </View>
            {result.feedback && (
              <Text style={styles.feedback}>{result.feedback}</Text>
            )}
          </Card>
        )
      })}

      {testResults.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="grade" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No test results</Text>
          <Text style={styles.emptyDescription}>No tests have been graded for this student</Text>
        </View>
      )}
    </View>
  )

  const renderHomework = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Homework Submissions</Text>
      </View>

      {homeworkSubmissions.map((submission) => {
        const assignment = data.homeworkAssignments.find(a => a.id === submission.assignmentId)
        const classInfo = data.classes.find(cls => cls.id === assignment?.classId)
        
        const statusColors = {
          submitted: '#007AFF',
          graded: '#34C759',
          late: '#FF9500',
          missing: '#FF3B30'
        }

        return (
          <Card key={submission.id} style={styles.homeworkCard}>
            <View style={styles.homeworkHeader}>
              <View style={styles.homeworkInfo}>
                <Text style={styles.homeworkTitle}>{assignment?.title || 'Unknown Assignment'}</Text>
                <Text style={styles.homeworkClass}>{classInfo?.name || 'Unknown Class'}</Text>
                <Text style={styles.homeworkDate}>
                  Due: {assignment?.dueDate} | Submitted: {submission.submittedDate}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColors[submission.status]}20` }]}>
                <Text style={[styles.statusText, { color: statusColors[submission.status] }]}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </Text>
              </View>
            </View>
            {submission.score !== undefined && (
              <View style={styles.homeworkScore}>
                <Text style={styles.scoreText}>
                  Score: {submission.score}/{assignment?.totalPoints}
                </Text>
              </View>
            )}
            {submission.feedback && (
              <Text style={styles.feedback}>{submission.feedback}</Text>
            )}
          </Card>
        )
      })}

      {homeworkSubmissions.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="assignment" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No homework submissions</Text>
          <Text style={styles.emptyDescription}>No homework has been submitted by this student</Text>
        </View>
      )}
    </View>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'classes':
        return renderClasses()
      case 'attendance':
        return renderAttendance()
      case 'grades':
        return renderGrades()
      case 'homework':
        return renderHomework()
      default:
        return renderOverview()
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.studentHeaderInfo}>
          <View style={styles.studentAvatar}>
            <Icon name="person" size={32} color="#007AFF" />
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.headerTitle}>{student.name}</Text>
            <Text style={styles.headerSubtitle}>Enrolled: {student.enrollmentDate}</Text>
          </View>
        </View>
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
  studentHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentDetails: {
    flex: 1,
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
  contactCard: {
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
  attendanceRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  averageGrade: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  classCard: {
    marginBottom: 12,
  },
  classHeader: {
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  classSubject: {
    fontSize: 14,
    color: '#6b7280',
  },
  classDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  attendanceCard: {
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceClass: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  attendanceDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  gradeCard: {
    marginBottom: 12,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gradeInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  testClass: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  testDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  gradeScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 2,
  },
  feedback: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  homeworkCard: {
    marginBottom: 12,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  homeworkInfo: {
    flex: 1,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  homeworkClass: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  homeworkDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  homeworkScore: {
    marginBottom: 8,
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
    lineHeight: 20,
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