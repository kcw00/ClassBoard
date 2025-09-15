import config from './index';

export interface SecurityConfig {
  fileUpload: {
    maxSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    virusScanEnabled: boolean;
    quarantineEnabled: boolean;
  };
  rateLimit: {
    general: {
      windowMs: number;
      max: number;
    };
    auth: {
      windowMs: number;
      max: number;
    };
    upload: {
      windowMs: number;
      max: number;
    };
  };
  cors: {
    allowedOrigins: string[];
    credentials: boolean;
    maxAge: number;
  };
  headers: {
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    csp: {
      directives: Record<string, string[]>;
    };
  };
  validation: {
    maxRequestSize: string;
    sanitizeInput: boolean;
    preventSqlInjection: boolean;
    validateFileContent: boolean;
  };
  monitoring: {
    logSecurityEvents: boolean;
    alertOnThreats: boolean;
    auditSensitiveEndpoints: boolean;
  };
}

/**
 * Security configuration based on environment
 */
export const securityConfig: SecurityConfig = {
  fileUpload: {
    maxSize: parseFileSize(config.security.maxFileSize),
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.csv', '.md'
    ],
    virusScanEnabled: config.security.enableVirusScanning,
    quarantineEnabled: config.server.nodeEnv === 'production'
  },
  rateLimit: {
    general: {
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // 5 attempts per window
    },
    upload: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10 // 10 uploads per window
    }
  },
  cors: {
    allowedOrigins: [
      config.cors.frontendUrl,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    csp: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'worker-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"],
        'manifest-src': ["'self'"]
      }
    }
  },
  validation: {
    maxRequestSize: '10mb',
    sanitizeInput: true,
    preventSqlInjection: true,
    validateFileContent: true
  },
  monitoring: {
    logSecurityEvents: true,
    alertOnThreats: config.server.nodeEnv === 'production',
    auditSensitiveEndpoints: true
  }
};

/**
 * Parse file size string to bytes
 */
function parseFileSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i);
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeStr}`);
  }

  const [, size, unit] = match;
  const multiplier = units[unit.toUpperCase()];
  if (!multiplier) {
    throw new Error(`Unknown file size unit: ${unit}`);
  }

  return Math.floor(parseFloat(size) * multiplier);
}

/**
 * Get security configuration for specific environment
 */
export function getSecurityConfig(environment?: string): SecurityConfig {
  const env = environment || config.server.nodeEnv;
  
  // Production-specific overrides
  if (env === 'production') {
    return {
      ...securityConfig,
      fileUpload: {
        ...securityConfig.fileUpload,
        virusScanEnabled: true,
        quarantineEnabled: true
      },
      validation: {
        ...securityConfig.validation,
        validateFileContent: true
      },
      monitoring: {
        ...securityConfig.monitoring,
        alertOnThreats: true
      }
    };
  }

  // Development-specific overrides
  if (env === 'development') {
    return {
      ...securityConfig,
      rateLimit: {
        ...securityConfig.rateLimit,
        general: {
          ...securityConfig.rateLimit.general,
          max: 1000 // Higher limit for development
        }
      },
      monitoring: {
        ...securityConfig.monitoring,
        alertOnThreats: false
      }
    };
  }

  return securityConfig;
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: SecurityConfig): string[] {
  const errors: string[] = [];

  // Validate file upload settings
  if (config.fileUpload.maxSize <= 0) {
    errors.push('File upload max size must be greater than 0');
  }

  if (config.fileUpload.allowedMimeTypes.length === 0) {
    errors.push('At least one MIME type must be allowed for file uploads');
  }

  // Validate rate limit settings
  if (config.rateLimit.general.max <= 0) {
    errors.push('Rate limit max must be greater than 0');
  }

  if (config.rateLimit.general.windowMs <= 0) {
    errors.push('Rate limit window must be greater than 0');
  }

  // Validate CORS settings
  if (config.cors.allowedOrigins.length === 0) {
    errors.push('At least one origin must be allowed for CORS');
  }

  return errors;
}

/**
 * Security middleware configuration
 */
export const securityMiddlewareConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: securityConfig.headers.csp.directives
    },
    hsts: securityConfig.headers.hsts,
    noSniff: true,
    frameguard: { action: 'deny' as const },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const }
  },
  cors: {
    origin: securityConfig.cors.allowedOrigins,
    credentials: securityConfig.cors.credentials,
    maxAge: securityConfig.cors.maxAge
  },
  rateLimit: securityConfig.rateLimit
};

export default securityConfig;