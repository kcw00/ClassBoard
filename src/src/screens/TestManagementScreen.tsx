import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function TestManagementScreen() {
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filteredTests = data.tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    const today = new Date()
    const testDate = new Date(test.testDate)
    
    switch (activeTab) {
      case 'upcoming':
        return testDate > today
      case 'past':
        return testDate <= today
      case 'ready-to-mark':
        return getTestsNeedingResults(test.id).length > 0
      default:
        return true
    }
  })

  const getTestsNeedingResults = (testId: string) => {
    const test = data.tests.find(t => t.id === testId)
    if (!test) return []
    
    const classItem = data.classes.find(cls => cls.id === test.classId)
    if (!classItem) return []
    
    const enrolledStudents = data.students.filter(student => 
      classItem.enrolledStudents.includes(student.id)
    )
    
    const existingResults = data.testResults.filter(result => result.testId === testId)
    const studentsWithResults = existingResults.map(result => result.studentId)
    
    return enrolledStudents.filter(student => !studentsWithResults.includes(student.id))
  }

  const getTestStats = () => {
    const today = new Date()
    const upcomingTests = data.tests.filter(test => new Date(test.testDate) > today)
    const pastTests = data.tests.filter(test => new Date(test.testDate) <= today)
    const testsNeedingResults = data.tests.filter(test => 
      getTestsNeedingResults(test.id).length > 0
    )
    
    return {
      total: data.tests.length,
      upcoming: upcomingTests.length,
      past: pastTests.length,
      needingResults: testsNeedingResults.length
    }
  }

  const navigateToTestDetails = (testId: string) => {
    navigation.navigate('TestDetails' as never, { testId } as never)
  }

  const handleAddTest = () => {
    Alert.alert(
      'Add New Test',
      'This feature would open a form to add a new test.',
      [{ text: 'OK' }]
    )
  }

  const handleQuickAction = (action: string, test: any) => {
    switch (action) {
      case 'grade':
        Alert.alert('Grade Test', `This would open grading interface for ${test.title}`)
        break
      case 'results':
        Alert.alert('View Results', `This would show results for ${test.title}`)
        break
      case 'edit':
        Alert.alert('Edit Test', `This would open edit form for ${test.title}`)
        break
      default:
        break
    }
  }

  const getTestStatusColor = (test: any) => {
    const today = new Date()
    const testDate = new Date(test.testDate)
    const needsResults = getTestsNeedingResults(test.id).length > 0
    
    if (testDate > today) return '#007AFF' // Upcoming - Blue
    if (needsResults) return '#FF9500' // Needs grading - Orange
    return '#34C759' // Complete - Green
  }

  const getTestStatusText = (test: any) => {
    const today = new Date()
    const testDate = new Date(test.testDate)
    const needsResults = getTestsNeedingResults(test.id).length > 0
    
    if (testDate > today) return 'Upcoming'
    if (needsResults) return 'Needs Grading'
    return 'Complete'
  }

  const stats = getTestStats()
  
  const tabs = [
    { id: 'all', title: 'All Tests', count: stats.total },
    { id: 'upcoming', title: 'Upcoming', count: stats.upcoming },
    { id: 'ready-to-mark', title: 'Ready to Mark', count: stats.needingResults },
    { id: 'past', title: 'Past Tests', count: stats.past },
  ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test Management</Text>
        <Button
          title="Add Test"
          onPress={handleAddTest}
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setActiveTab('all')}
          >
            <Icon name="assignment" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setActiveTab('upcoming')}
          >
            <Icon name="schedule" size={24} color="#34C759" />
            <Text style={styles.statValue}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setActiveTab('ready-to-mark')}
          >
            <Icon name="grade" size={24} color="#FF9500" />
            <Text style={styles.statValue}>{stats.needingResults}</Text>
            <Text style={styles.statLabel}>To Grade</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => setActiveTab('past')}
          >
            <Icon name="check-circle" size={24} color="#6b7280" />
            <Text style={styles.statValue}>{stats.past}</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </TouchableOpacity>
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
            <Text style={[
              styles.tabText, 
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tests List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTests.map((test) => {
          const classItem = data.classes.find(cls => cls.id === test.classId)
          const studentsNeedingResults = getTestsNeedingResults(test.id)
          const totalStudents = classItem ? data.students.filter(s => 
            classItem.enrolledStudents.includes(s.id)
          ).length : 0
          const gradedStudents = data.testResults.filter(result => result.testId === test.id).length
          const statusColor = getTestStatusColor(test)
          const statusText = getTestStatusText(test)

          return (
            <Card key={test.id} style={styles.testCard} onPress={() => navigateToTestDetails(test.id)}>
              <View style={styles.testHeader}>
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <Text style={styles.testClass}>{classItem?.name || 'Unknown Class'}</Text>
                </View>
                <View style={styles.testStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusText}
                    </Text>
                  </View>
                  <Text style={styles.testPoints}>{test.totalPoints} pts</Text>
                </View>
              </View>
              
              <View style={styles.testDetails}>
                <View style={styles.detailRow}>
                  <Icon name="event" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Date: {test.testDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="category" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Type: {test.testType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="people" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    Graded: {gradedStudents}/{totalStudents} students
                  </Text>
                </View>
              </View>

              {test.description && (
                <Text style={styles.testDescription} numberOfLines={2}>
                  {test.description}
                </Text>
              )}

              {studentsNeedingResults.length > 0 && (
                <View style={styles.gradingAlert}>
                  <Icon name="warning" size={16} color="#FF9500" />
                  <Text style={styles.gradingAlertText}>
                    {studentsNeedingResults.length} student{studentsNeedingResults.length !== 1 ? 's' : ''} need{studentsNeedingResults.length === 1 ? 's' : ''} grading
                  </Text>
                </View>
              )}

              <View style={styles.testActions}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: totalStudents > 0 ? `${(gradedStudents / totalStudents) * 100}%` : '0%',
                          backgroundColor: statusColor 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {totalStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0}% complete
                  </Text>
                </View>
                <View style={styles.quickActions}>
                  {studentsNeedingResults.length > 0 && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleQuickAction('grade', test)}
                    >
                      <Icon name="grade" size={16} color="#FF9500" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleQuickAction('results', test)}
                  >
                    <Icon name="bar-chart" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleQuickAction('edit', test)}
                  >
                    <Icon name="edit" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )
        })}

        {filteredTests.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No tests found' : 'No tests yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 
                'Try adjusting your search terms or filter' : 
                'Create your first test to start assessing student progress'
              }
            </Text>
            {!searchQuery && (
              <Button
                title="Create Test"
                onPress={handleAddTest}
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
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
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
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
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
  testCard: {
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  testClass: {
    fontSize: 14,
    color: '#6b7280',
  },
  testStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  testDetails: {
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
  testDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  gradingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  gradingAlertText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
  },
  testActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
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
    minWidth: 120,
  },
})