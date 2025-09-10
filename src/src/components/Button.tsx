import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  style?: object
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style 
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ]

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText
  ]

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#007AFF'} 
          size="small" 
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#334155',
  },
  outlineText: {
    color: '#007AFF',
  },
  destructiveText: {
    color: '#fff',
  },
  
  // Sizes for text
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
})