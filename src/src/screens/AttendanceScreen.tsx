import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function AttendanceScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getAttendanceForDate = (date: string) => {
    return data.attendanceRecords.filter(record => record.date === date)
  }

  const getClassStudents = (classId: string) => {
    const classItem = data.classes.find(cls => cls.id === classId)
    if (!classItem) return []
    
    return data.students.filter(student => 
      classItem.enrolledStudents.includes(student.id)
    )
  }

  const getStudentAttendanceStatus = (studentId: string, classId: string, date: string) => {
    const attendanceRecord = data.attendanceRecords.find(record => 
      record.date === date && record.classId === classId
    )
    
    if (!attendanceRecord) return null
    
    return attendanceRecord.attendanceData.find(entry => entry.studentId === studentId)
  }

  const updateAttendanceStatus = (studentId: string, classId: string, date: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    const existingRecord = data.attendanceRecords.find(record => 
      record.date === date && record.classId === classId
    )

    if (existingRecord) {
      const updatedAttendanceData = existingRecord.attendanceData.filter(entry => 
        entry.studentId !== studentId
      )
      updatedAttendanceData.push({ studentId, status, notes })
      
      actions.updateAttendanceRecord(existingRecord.id, {
        attendanceData: updatedAttendanceData
      })
    } else {
      actions.addAttendanceRecord({
        classId,
        date,
        attendanceData: [{ studentId, status, notes }]
      })
    }
  }

  const getAttendanceStats = () => {
    const todayRecords = getAttendanceForDate(selectedDate)
    let totalStudents = 0
    let presentStudents = 0
    let absentStudents = 0
    let lateStudents = 0
    let excusedStudents = 0

    todayRecords.forEach(record => {
      record.attendanceData.forEach(entry => {
        totalStudents++
        switch (entry.status) {
          case 'present':
            presentStudents++
            break
          case 'absent':
            absentStudents++
            break
          case 'late':
            lateStudents++
            break
          case 'excused':
            excusedStudents++
            break
        }
      })
    })

    return { totalStudents, presentStudents, absentStudents, lateStudents, excusedStudents }
  }

  const handleMarkAllPresent = (classId: string) => {
    Alert.alert(
      'Mark All Present',
      'Are you sure you want to mark all students in this class as present?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            const students = getClassStudents(classId)
            students.forEach(student => {
              updateAttendanceStatus(student.id, classId, selectedDate, 'present')
            })
            Alert.alert('Success', 'All students marked as present')
          }
        }
      ]
    )
  }

  const handleStatusChange = (studentId: string, classId: string, currentStatus: string | null) => {
    const statusOptions = [
      { label: 'Present', value: 'present', color: '#34C759' },
      { label: 'Absent', value: 'absent', color: '#FF3B30' },
      { label: 'Late', value: 'late', color: '#FF9500' },
      { label: 'Excused', value: 'excused', color: '#007AFF' }
    ]

    Alert.alert(
      'Update Attendance',
      'Select attendance status:',
      [
        ...statusOptions.map(option => ({
          text: option.label,
          onPress: () => updateAttendanceStatus(studentId, classId, selectedDate, option.value as any)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const stats = getAttendanceStats()
  const todayAttendance = getAttendanceForDate(selectedDate)

  const StatusIcon = ({ status }: { status: string }) => {
    const statusConfig = {
      present: { icon: 'check-circle', color: '#34C759' },
      absent: { icon: 'cancel', color: '#FF3B30' },
      late: { icon: 'schedule', color: '#FF9500' },
      excused: { icon: 'info', color: '#007AFF' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { icon: 'help', color: '#6b7280' }
    
    return <Icon name={config.icon} size={20} color={config.color} />
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            onPress={() => {
              const prevDate = new Date(selectedDate)
              prevDate.setDate(prevDate.getDate() - 1)
              setSelectedDate(prevDate.toISOString().split('T')[0])
            }}
            style={styles.dateNavButton}
          >
            <Icon name="chevron-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity 
            onPress={() => {
              const nextDate = new Date(selectedDate)
              nextDate.setDate(nextDate.getDate() + 1)
              setSelectedDate(nextDate.toISOString().split('T')[0])
            }}
            style={styles.dateNavButton}
          >
            <Icon name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      {stats.totalStudents > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.presentStudents}</Text>
              <Text style={styles.statLabel}>Present</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#34C759' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.absentStudents}</Text>
              <Text style={styles.statLabel}>Absent</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#FF3B30' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.lateStudents}</Text>
              <Text style={styles.statLabel}>Late</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#FF9500' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.excusedStudents}</Text>
              <Text style={styles.statLabel}>Excused</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#007AFF' }]} />
            </View>
          </View>
        </View>
      )}

      {/* Classes List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {data.classes.map((classItem) => {
          const students = getClassStudents(classItem.id)
          if (students.length === 0) return null

          const attendanceRecord = data.attendanceRecords.find(record => 
            record.date === selectedDate && record.classId === classItem.id
          )
          
          const attendanceMarked = attendanceRecord?.attendanceData.length || 0
          const totalStudents = students.length
          const attendanceRate = totalStudents > 0 ? Math.round((attendanceMarked / totalStudents) * 100) : 0

          return (
            <Card key={classItem.id} style={styles.classCard}>
              <CardHeader>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <CardTitle>{classItem.name}</CardTitle>
                    <Text style={styles.classSubject}>{classItem.subject}</Text>
                  </View>
                  <View style={styles.classActions}>
                    <Text style={styles.attendanceRate}>
                      {attendanceMarked}/{totalStudents} marked
                    </Text>
                    <Button
                      title="Mark All Present"
                      onPress={() => handleMarkAllPresent(classItem.id)}
                      variant="outline"
                      size="small"
                      style={styles.markAllButton}
                    />
                  </View>
                </View>
              </CardHeader>
              <CardContent>
                <View style={styles.studentsList}>
                  {students.map((student) => {
                    const attendanceStatus = getStudentAttendanceStatus(student.id, classItem.id, selectedDate)
                    
                    return (
                      <TouchableOpacity
                        key={student.id}
                        style={styles.studentRow}
                        onPress={() => handleStatusChange(student.id, classItem.id, attendanceStatus?.status || null)}
                      >
                        <View style={styles.studentInfo}>
                          <View style={styles.studentAvatar}>
                            <Icon name="person" size={20} color="#007AFF" />
                          </View>
                          <View style={styles.studentDetails}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            <Text style={styles.studentEmail}>{student.email}</Text>
                          </View>
                        </View>
                        <View style={styles.attendanceStatus}>
                          {attendanceStatus ? (
                            <View style={styles.statusContainer}>
                              <StatusIcon status={attendanceStatus.status} />
                              <Text style={[
                                styles.statusText,
                                { color: attendanceStatus.status === 'present' ? '#34C759' : 
                                         attendanceStatus.status === 'absent' ? '#FF3B30' :
                                         attendanceStatus.status === 'late' ? '#FF9500' : '#007AFF' }
                              ]}>
                                {attendanceStatus.status.charAt(0).toUpperCase() + attendanceStatus.status.slice(1)}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.noStatusContainer}>
                              <Icon name="help-outline" size={20} color="#d1d5db" />
                              <Text style={styles.noStatusText}>Not marked</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </CardContent>
            </Card>
          )
        })}

        {data.classes.filter(cls => getClassStudents(cls.id).length > 0).length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No classes with students</Text>
            <Text style={styles.emptyDescription}>
              Add students to your classes to start taking attendance
            </Text>
            <Button
              title="Go to Classes"
              onPress={() => navigation.navigate('Classes' as never)}
              style={styles.emptyButton}
            />
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavButton: {
    padding: 8,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginHorizontal: 16,
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
    position: 'relative',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statIndicator: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 3,
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  classCard: {
    marginBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  classActions: {
    alignItems: 'flex-end',
  },
  attendanceRate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  markAllButton: {
    minWidth: 100,
  },
  studentsList: {
    marginTop: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  attendanceStatus: {
    paddingLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  noStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noStatusText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
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
  },
  emptyButton: {
    minWidth: 120,
  },
})