#!/usr/bin/env node

// Simple test runner to check if our tests can run
const { execSync } = require('child_process')

console.log('🧪 Running frontend tests...')

try {
  // Run only the simple tests first
  console.log('Running basic service tests...')
  execSync('npm test -- --testPathPattern="simple|core" --verbose', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('✅ Basic tests passed!')
  
  // Run all tests
  console.log('Running all tests...')
  execSync('npm test -- --watchAll=false --verbose', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('✅ All tests passed!')
  
} catch (error) {
  console.error('❌ Tests failed:', error.message)
  process.exit(1)
}