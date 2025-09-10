import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useAppData } from '../context/AppDataContext'

export default function TestDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { data, actions } = useAppData()
  const [activeTab, setActiveTab] = useState('overview')
  const [gradingStudent, setGradingStudent] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  
  const { testId } = route.params as { testId: string }
  const test = data.tests.find(t => t.id === testId)

  if (!test) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Test not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    )
  }

  const classItem = data.classes.find(cls => cls.id === test.classId)
  const enrolledStudents = classItem ? data.students.filter(student => 
    classItem.enrolledStudents.includes(student.id)
  ) : []

  const testResults = data.testResults.filter(result => result.testId === testId)
  const studentsWithResults = testResults.map(result => result.studentId)
  const studentsNeedingResults = enrolledStudents.filter(student => 
    !studentsWithResults.includes(student.id)
  )

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'info' },
    { id: 'results', title: 'Results', icon: 'grade' },
    { id: 'grading', title: 'Grading', icon: 'edit' },
    { id: 'analytics', title: 'Analytics', icon: 'bar-chart' },
  ]

  const calculateStats = () => {
    if (testResults.length === 0) {
      return {
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0
      }
    }

    const scores = testResults.map(result => result.score)
    const percentages = testResults.map(result => result.percentage)
    const passThreshold = 60 // 60% pass rate
    const passCount = percentages.filter(p => p >= passThreshold).length

    return {
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      averagePercentage: Math.round(percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: Math.round((passCount / testResults.length) * 100)
    }
  }

  const handleGradeSubmit = (studentId: string) => {
    const score = parseInt(gradeInput)
    if (isNaN(score) || score < 0 || score > test.totalPoints) {
      Alert.alert('Invalid Score', `Please enter a score between 0 and ${test.totalPoints}`)
      return
    }

    const percentage = Math.round((score / test.totalPoints) * 100)
    const grade = getLetterGrade(percentage)

    const existingResult = testResults.find(result => result.studentId === studentId)
    
    if (existingResult) {
      actions.updateTestResult(existingResult.id, {
        score,
        percentage,
        grade,
        feedback: feedbackInput,
        gradedDate: new Date().toISOString().split('T')[0]
      })
    } else {
      actions.addTestResult({
        testId,
        studentId,
        score,
        maxScore: test.totalPoints,
        percentage,
        grade,
        feedback: feedbackInput,
        gradedDate: new Date().toISOString().split('T')[0]
      })
    }

    setGradingStudent(null)
    setGradeInput('')
    setFeedbackInput('')
    Alert.alert('Success', 'Grade saved successfully')
  }

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 95) return 'A+'
    if (percentage >= 90) return 'A'
    if (percentage >= 85) return 'A-'
    if (percentage >= 80) return 'B+'
    if (percentage >= 75) return 'B'
    if (percentage >= 70) return 'B-'
    if (percentage >= 65) return 'C+'
    if (percentage >= 60) return 'C'
    if (percentage >= 55) return 'C-'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  const handleEdit = () => {
    Alert.alert(
      'Edit Test',
      'This feature would open a form to edit test details.',
      [{ text: 'OK' }]
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Test',
      'Are you sure you want to delete this test? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            actions.deleteTest(testId)
            navigation.goBack()
            Alert.alert('Success', 'Test deleted successfully')
          }
        }
      ]
    )
  }

  const stats = calculateStats()

  const renderOverview = () => (
    <View>
      <Card style={styles.overviewCard}>
        <CardHeader>
          <View style={styles.overviewHeader}>
            <CardTitle>Test Information</CardTitle>
            <View style={styles.headerActions}>
              <Button
                title="Edit"
                onPress={handleEdit}
                variant="outline"
                size="small"
                style={styles.editButton}
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="destructive"
                size="small"
                style={styles.deleteButton}
              />
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class:</Text>
            <Text style={styles.infoValue}>{classItem?.name || 'Unknown Class'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subject:</Text>
            <Text style={styles.infoValue}>{classItem?.subject || 'Unknown Subject'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{test.testDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{test.testType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Points:</Text>
            <Text style={styles.infoValue}>{test.totalPoints}</Text>
          </View>
          {test.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{test.description}</Text>
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
            <Icon name="grade" size={24} color="#34C759" />
            <Text style={styles.statValue}>{testResults.length}</Text>
            <Text style={styles.statLabel}>Graded</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Icon name="pending" size={24} color="#FF9500" />
            <Text style={styles.statValue}>{studentsNeedingResults.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </Card>
      </View>

      {testResults.length > 0 && (
        <Card style={styles.quickStatsCard}>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.averagePercentage}%</Text>
                <Text style={styles.quickStatLabel}>Average</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.highestScore}</Text>
                <Text style={styles.quickStatLabel}>Highest</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.lowestScore}</Text>
                <Text style={styles.quickStatLabel}>Lowest</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.passRate}%</Text>
                <Text style={styles.quickStatLabel}>Pass Rate</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  )

  const renderResults = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <Text style={styles.resultsCount}>
          {testResults.length}/{enrolledStudents.length} graded
        </Text>
      </View>

      {testResults.map((result) => {
        const student = data.students.find(s => s.id === result.studentId)
        if (!student) return null

        return (
          <Card key={result.id} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Icon name="person" size={20} color="#007AFF" />
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                </View>
              </View>
              <View style={styles.gradeInfo}>
                <Text style={styles.scoreText}>{result.score}/{result.maxScore}</Text>
                <Text style={styles.percentageText}>{result.percentage}%</Text>
                <Text style={styles.gradeText}>{result.grade}</Text>
              </View>
            </View>
            {result.feedback && (
              <Text style={styles.feedback}>{result.feedback}</Text>
            )}
            <Text style={styles.gradedDate}>Graded: {result.gradedDate}</Text>
          </Card>
        )
      })}

      {testResults.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="grade" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No results yet</Text>
          <Text style={styles.emptyDescription}>Start grading to see test results here</Text>
        </View>
      )}
    </View>
  )

  const renderGrading = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Grade Students</Text>
        <Text style={styles.pendingCount}>
          {studentsNeedingResults.length} pending
        </Text>
      </View>

      {gradingStudent && (
        <Card style={styles.gradingForm}>
          <CardHeader>
            <View style={styles.gradingHeader}>
              <CardTitle>Grade Student</CardTitle>
              <TouchableOpacity onPress={() => setGradingStudent(null)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Student:</Text>
              <Text style={styles.formValue}>
                {data.students.find(s => s.id === gradingStudent)?.name}
              </Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Score (out of {test.totalPoints}):</Text>
              <TextInput
                style={styles.gradeInput}
                value={gradeInput}
                onChangeText={setGradeInput}
                keyboardType="numeric"
                placeholder="Enter score"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Feedback (optional):</Text>
              <TextInput
                style={styles.feedbackInput}
                value={feedbackInput}
                onChangeText={setFeedbackInput}
                placeholder="Add feedback for the student"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={() => setGradingStudent(null)}
                variant="outline"
                size="small"
                style={styles.cancelButton}
              />
              <Button
                title="Save Grade"
                onPress={() => handleGradeSubmit(gradingStudent)}
                size="small"
                style={styles.saveButton}
              />
            </View>
          </CardContent>
        </Card>
      )}

      {studentsNeedingResults.map((student) => (
        <Card key={student.id} style={styles.studentGradingCard}>
          <View style={styles.studentGradingContent}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Icon name="person" size={20} color="#007AFF" />
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentEmail}>{student.email}</Text>
              </View>
            </View>
            <Button
              title="Grade"
              onPress={() => setGradingStudent(student.id)}
              size="small"
              style={styles.gradeButton}
            />
          </View>
        </Card>
      ))}

      {studentsNeedingResults.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color="#34C759" />
          <Text style={styles.emptyTitle}>All students graded!</Text>
          <Text style={styles.emptyDescription}>
            All students have been graded for this test
          </Text>
        </View>
      )}
    </View>
  )

  const renderAnalytics = () => (
    <View>
      {testResults.length > 0 ? (
        <View>
          <Card style={styles.analyticsCard}>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticItem}>
                  <Text style={styles.analyticValue}>{stats.averageScore}</Text>
                  <Text style={styles.analyticLabel}>Average Score</Text>
                </View>
                <View style={styles.analyticItem}>
                  <Text style={styles.analyticValue}>{stats.averagePercentage}%</Text>
                  <Text style={styles.analyticLabel}>Average %</Text>
                </View>
                <View style={styles.analyticItem}>
                  <Text style={styles.analyticValue}>{stats.highestScore}</Text>
                  <Text style={styles.analyticLabel}>Highest Score</Text>
                </View>
                <View style={styles.analyticItem}>
                  <Text style={styles.analyticValue}>{stats.lowestScore}</Text>
                  <Text style={styles.analyticLabel}>Lowest Score</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.analyticsCard}>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.gradeDistribution}>
                {['A', 'B', 'C', 'D', 'F'].map(grade => {
                  const count = testResults.filter(result => result.grade.charAt(0) === grade).length
                  const percentage = testResults.length > 0 ? Math.round((count / testResults.length) * 100) : 0
                  
                  return (
                    <View key={grade} style={styles.gradeDistItem}>
                      <Text style={styles.gradeDistLabel}>{grade}</Text>
                      <View style={styles.gradeDistBar}>
                        <View 
                          style={[
                            styles.gradeDistFill, 
                            { width: `${percentage}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.gradeDistCount}>{count}</Text>
                    </View>
                  )
                })}
              </View>
            </CardContent>
          </Card>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="bar-chart" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No analytics available</Text>
          <Text style={styles.emptyDescription}>
            Grade some tests to see analytics and insights
          </Text>
        </View>
      )}
    </View>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'results':
        return renderResults()
      case 'grading':
        return renderGrading()
      case 'analytics':
        return renderAnalytics()
      default:
        return renderOverview()
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{test.title}</Text>
          <Text style={styles.headerSubtitle}>
            {classItem?.name || 'Unknown Class'} • {test.testDate}
          </Text>
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
  headerInfo: {
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
  overviewCard: {
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  editButton: {
    marginRight: 8,
    minWidth: 60,
  },
  deleteButton: {
    minWidth: 60,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 100,
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
    marginBottom: 16,
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
  quickStatsCard: {
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quickStatLabel: {
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
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  pendingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  studentDetails: {
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
  gradeInfo: {
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
  gradedDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  gradingForm: {
    marginBottom: 16,
  },
  gradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  studentGradingCard: {
    marginBottom: 12,
  },
  studentGradingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeButton: {
    minWidth: 80,
  },
  analyticsCard: {
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  analyticLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  gradeDistribution: {
    marginTop: 8,
  },
  gradeDistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeDistLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    width: 20,
  },
  gradeDistBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  gradeDistFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  gradeDistCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 30,
    textAlign: 'right',
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