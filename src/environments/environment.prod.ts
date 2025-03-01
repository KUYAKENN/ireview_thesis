export const environment = {
    production: true,
    appName: 'iReview',
    version: '1.0.0',
    
    // API Configuration
    apiUrl: 'https://api.ireview.com/api', // Replace with your production API URL
    
    // Authentication Configuration
    authConfig: {
      tokenKey: 'ireview_token',
      refreshTokenKey: 'ireview_refresh_token',
      tokenExpiryKey: 'ireview_token_expiry'
    },
  
    // File Upload Configuration
    fileUpload: {
      maxSize: 5242880, // 5MB in bytes
      allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'],
      uploadUrl: 'https://api.ireview.com/api/upload' // Replace with your production upload URL
    },
  
    // Pagination Configuration
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 50
    },
  
    // Feature Flags
    features: {
      enableGoogleLogin: true,
      enablePasswordReset: true,
      enableRegistration: true,
      enableFileUpload: true
    },
  
    // Timeouts and Intervals (in milliseconds)
    timeouts: {
      apiRequest: 30000,      // 30 seconds
      sessionExpiry: 3600000, // 1 hour
      carouselInterval: 5000  // 5 seconds
    },
  
    // Error Handling Configuration
    errorConfig: {
      maxRetries: 3,
      retryDelay: 1000 // 1 second
    },
  
    // Analytics Configuration
    analytics: {
      enabled: true,
      trackingId: 'UA-XXXXXXXXX-X' // Replace with your analytics tracking ID
    }
  };