import { renderHook } from '@testing-library/react'

// Simple test to verify @testing-library/react is working
describe('Testing Library Setup', () => {
  it('should import renderHook without errors', () => {
    expect(renderHook).toBeDefined()
    expect(typeof renderHook).toBe('function')
  })

  it('should render a simple hook', () => {
    const useSimpleHook = () => {
      return { value: 'test' }
    }

    const { result } = renderHook(() => useSimpleHook())
    expect(result.current.value).toBe('test')
  })
})