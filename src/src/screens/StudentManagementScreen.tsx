import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function StudentManagementScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = data.students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery)
  )

  const navigateToStudentDetails = (studentId: string) => {
    navigation.navigate('StudentDetails' as never, { studentId } as never)
  }

  const handleAddStudent = () => {
    Alert.alert(
      'Add New Student',
      'This feature would open a form to add a new student.',
      [{ text: 'OK' }]
    )
  }

  const getStudentClasses = (studentId: string) => {
    return data.classes.filter(cls => cls.enrolledStudents.includes(studentId))
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Management</Text>
        <Button
          title="Add Student"
          onPress={handleAddStudent}
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Students List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredStudents.map((student) => {
          const enrolledClasses = getStudentClasses(student.id)
          return (
            <Card key={student.id} style={styles.studentCard} onPress={() => navigateToStudentDetails(student.id)}>
              <View style={styles.studentHeader}>
                <View style={styles.studentAvatar}>
                  <Icon name="person" size={24} color="#007AFF" />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                </View>
                <View style={styles.studentAction}>
                  <Icon name="chevron-right" size={20} color="#6b7280" />
                </View>
              </View>
              
              <View style={styles.studentDetails}>
                <View style={styles.detailRow}>
                  <Icon name="phone" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{student.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="event" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Enrolled: {student.enrollmentDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="school" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {enrolledClasses.length} class{enrolledClasses.length !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>

              {student.notes && (
                <Text style={styles.studentNotes} numberOfLines={2}>
                  {student.notes}
                </Text>
              )}

              <View style={styles.studentFooter}>
                <View style={styles.classesContainer}>
                  {enrolledClasses.slice(0, 3).map((cls) => (
                    <View key={cls.id} style={styles.classChip}>
                      <Text style={styles.classChipText}>{cls.subject}</Text>
                    </View>
                  ))}
                  {enrolledClasses.length > 3 && (
                    <Text style={styles.moreClassesText}>+{enrolledClasses.length - 3} more</Text>
                  )}
                </View>
              </View>
            </Card>
          )
        })}

        {filteredStudents.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="people" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first student to get started'}
            </Text>
            {!searchQuery && (
              <Button
                title="Add Student"
                onPress={handleAddStudent}
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
    minWidth: 100,
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
  studentCard: {
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentAction: {
    padding: 8,
  },
  studentDetails: {
    marginBottom: 12,
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
  studentNotes: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  classChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  moreClassesText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
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