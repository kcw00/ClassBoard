import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

interface CardProps {
  children: React.ReactNode
  style?: object
  onPress?: () => void
}

export function Card({ children, style, onPress }: CardProps) {
  const CardComponent = onPress ? TouchableOpacity : View
  
  return (
    <CardComponent style={[styles.card, style]} onPress={onPress}>
      {children}
    </CardComponent>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  style?: object
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.cardHeader, style]}>
      {children}
    </View>
  )
}

interface CardContentProps {
  children: React.ReactNode
  style?: object
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  style?: object
}

export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text style={[styles.cardTitle, style]}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
})