// Configuration files
export const config = {
  api: {
    baseUrl: (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
  },
  features: {
    useApiService: (import.meta as any)?.env?.VITE_USE_API_SERVICE === 'true' || false,
    enableOptimisticUpdates: true,
    enableCaching: true,
    enableToastNotifications: true,
  }
}

export default config