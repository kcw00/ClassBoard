import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import config from '../config';

/**
 * Enhanced security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'"
  ].join('; '));

  // Strict Transport Security (HTTPS enforcement)
  if (config.server.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()'
  ].join(', '));

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', (req as any).requestId || 'unknown');

  next();
}

/**
 * HTTPS enforcement middleware
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction) {
  // Skip in development
  if (config.server.nodeEnv !== 'production') {
    return next();
  }

  // Allow health check endpoints over HTTP for Railway deployment
  if (req.path.startsWith('/api/health')) {
    return next();
  }

  // Check if request is secure
  const isSecure = req.secure ||
                   req.get('X-Forwarded-Proto') === 'https' ||
                   req.get('X-Forwarded-Ssl') === 'on';

  if (!isSecure) {
    return res.status(426).json({
      success: false,
      error: {
        code: 'HTTPS_REQUIRED',
        message: 'HTTPS is required for this endpoint'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Request size limiting middleware
 */
export function limitRequestSize(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request size ${sizeInBytes} exceeds maximum allowed size of ${maxSizeInBytes} bytes`
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return next();
  };
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function ipWhitelist(allowedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }

    const clientIP = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection as any).socket?.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address'
        },
        timestamp: new Date().toISOString()
      });
    }

    return next();
  };
}

/**
 * Request timeout middleware
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout'
          },
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Prevent parameter pollution
 */
export function preventParameterPollution(req: Request, res: Response, next: NextFunction) {
  // Check for duplicate parameters in query string
  const queryKeys = Object.keys(req.query);
  const duplicateKeys = queryKeys.filter((key, index) => queryKeys.indexOf(key) !== index);

  if (duplicateKeys.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PARAMETER_POLLUTION',
        message: `Duplicate parameters detected: ${duplicateKeys.join(', ')}`
      },
      timestamp: new Date().toISOString()
    });
  }

  return next();
}

/**
 * Helmet configuration for enhanced security
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Parse size string to bytes
 */
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]{1,2})$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const [, size, unit] = match;
  const multiplier = units[unit];
  if (!multiplier) {
    throw new Error(`Unknown size unit: ${unit}`);
  }

  return Math.floor(parseFloat(size) * multiplier);
}

/**
 * Security audit logging
 */
export function securityAuditLog(req: Request, res: Response, next: NextFunction) {
  const securityEvents = {
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id || 'anonymous',
    headers: {
      authorization: req.get('Authorization') ? '[REDACTED]' : undefined,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      origin: req.get('Origin'),
      referer: req.get('Referer')
    }
  };

  // Log security-sensitive endpoints
  const sensitiveEndpoints = ['/api/auth', '/api/files/upload', '/api/admin'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isSensitive) {
    console.log('SECURITY_AUDIT:', JSON.stringify(securityEvents));
  }

  return next();
}