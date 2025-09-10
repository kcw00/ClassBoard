import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function ClassManagementScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClasses = data.classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navigateToClassDetails = (classId: string) => {
    navigation.navigate('ClassDetails' as never, { classId } as never)
  }

  const handleAddClass = () => {
    Alert.alert(
      'Add New Class',
      'This feature would open a form to add a new class.',
      [{ text: 'OK' }]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class Management</Text>
        <Button
          title="Add Class"
          onPress={handleAddClass}
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Classes List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredClasses.map((cls) => (
          <Card key={cls.id} style={styles.classCard} onPress={() => navigateToClassDetails(cls.id)}>
            <View style={styles.classHeader}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classSubject}>{cls.subject}</Text>
              </View>
              <View style={styles.enrollmentBadge}>
                <Text style={styles.enrollmentText}>
                  {cls.enrolledStudents.length}/{cls.capacity}
                </Text>
              </View>
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

            {cls.description && (
              <Text style={styles.classDescription} numberOfLines={2}>
                {cls.description}
              </Text>
            )}

            <View style={styles.classFooter}>
              <View style={styles.enrollmentInfo}>
                <Text style={styles.enrolledStudentsText}>
                  {cls.enrolledStudents.length} students enrolled
                </Text>
              </View>
              <View style={styles.classActions}>
                <Icon name="chevron-right" size={20} color="#6b7280" />
              </View>
            </View>
          </Card>
        ))}

        {filteredClasses.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="school" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No classes found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first class to get started'}
            </Text>
            {!searchQuery && (
              <Button
                title="Add Class"
                onPress={handleAddClass}
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
    minWidth: 80,
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
  classCard: {
    marginBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  classSubject: {
    fontSize: 14,
    color: '#6b7280',
  },
  enrollmentBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enrollmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  classDetails: {
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
  classDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrolledStudentsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  classActions: {
    padding: 4,
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