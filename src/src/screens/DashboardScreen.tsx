import React from 'react'
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card'
import { useAppData } from '../context/AppDataContext'

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const navigation = useNavigation()
  const { data } = useAppData()

  const getActiveClasses = () => {
    return data.classes.length
  }

  const getTotalStudents = () => {
    return data.students.length
  }

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = data.attendanceRecords.filter(record => record.date === today)
    return todayRecords.reduce((total, record) => total + record.attendanceData.length, 0)
  }

  const getUpcomingTests = () => {
    const today = new Date()
    return data.tests.filter(test => new Date(test.testDate) > today).length
  }

  const statsData = [
    {
      title: 'Active Classes',
      value: getActiveClasses(),
      icon: 'school',
      color: '#007AFF',
      onPress: () => navigation.navigate('Classes' as never)
    },
    {
      title: 'Total Students',
      value: getTotalStudents(),
      icon: 'people',
      color: '#34C759',
      onPress: () => navigation.navigate('Students' as never)
    },
    {
      title: 'Today\'s Attendance',
      value: getTodayAttendance(),
      icon: 'check-circle',
      color: '#FF9500',
      onPress: () => navigation.navigate('Attendance' as never)
    },
    {
      title: 'Upcoming Tests',
      value: getUpcomingTests(),
      icon: 'assignment',
      color: '#FF3B30',
      onPress: () => navigation.navigate('Tests' as never)
    }
  ]

  const recentActivities = [
    {
      id: '1',
      title: 'New student enrolled',
      description: 'Sarah Johnson joined Advanced Mathematics',
      time: '2 hours ago',
      icon: 'person-add'
    },
    {
      id: '2',
      title: 'Test results uploaded',
      description: 'Midterm Exam results for Physics Laboratory',
      time: '4 hours ago',
      icon: 'grade'
    },
    {
      id: '3',
      title: 'Class note added',
      description: 'Introduction to Calculus notes updated',
      time: '1 day ago',
      icon: 'note-add'
    }
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <Card key={index} style={styles.statCard} onPress={stat.onPress}>
            <View style={styles.statContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Icon name={activity.icon} size={20} color="#007AFF" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.quickActionsGrid}>
            <Card 
              style={styles.quickActionItem} 
              onPress={() => navigation.navigate('Attendance' as never)}
            >
              <View style={styles.quickActionContent}>
                <Icon name="check-circle" size={28} color="#34C759" />
                <Text style={styles.quickActionText}>Mark Attendance</Text>
              </View>
            </Card>
            <Card 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Tests' as never)}
            >
              <View style={styles.quickActionContent}>
                <Icon name="assignment" size={28} color="#FF9500" />
                <Text style={styles.quickActionText}>Add Test</Text>
              </View>
            </Card>
            <Card 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Students' as never)}
            >
              <View style={styles.quickActionContent}>
                <Icon name="person-add" size={28} color="#007AFF" />
                <Text style={styles.quickActionText}>Add Student</Text>
              </View>
            </Card>
            <Card 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Calendar' as never)}
            >
              <View style={styles.quickActionContent}>
                <Icon name="event" size={28} color="#FF3B30" />
                <Text style={styles.quickActionText}>View Calendar</Text>
              </View>
            </Card>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  activityCard: {
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickActionsCard: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: (width - 80) / 2,
    marginBottom: 12,
    padding: 12,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
})