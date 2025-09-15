import { Request } from 'express';
import config from '../config';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  details: Record<string, any>;
  resolved: boolean;
}

export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  MALICIOUS_INPUT = 'MALICIOUS_INPUT',
  FILE_THREAT_DETECTED = 'FILE_THREAT_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_SCAN_FAILURE = 'SECURITY_SCAN_FAILURE',
  INVALID_FILE_UPLOAD = 'INVALID_FILE_UPLOAD',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class SecurityAuditService {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 10000;
  private readonly alertThresholds: Partial<Record<SecurityEventType, number>> = {
    [SecurityEventType.AUTHENTICATION_FAILURE]: 5,
    [SecurityEventType.AUTHORIZATION_FAILURE]: 5,
    [SecurityEventType.MALICIOUS_INPUT]: 3,
    [SecurityEventType.FILE_THREAT_DETECTED]: 1,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: 10,
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: 5,
    [SecurityEventType.SECURITY_SCAN_FAILURE]: 3,
    [SecurityEventType.INVALID_FILE_UPLOAD]: 10,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: 1,
    [SecurityEventType.XSS_ATTEMPT]: 1,
    [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: 1,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 3
  };

  /**
   * Log a security event
   */
  logSecurityEvent(
    type: SecurityEventType,
    req: Request,
    details: Record<string, any> = {},
    severity?: SecuritySeverity
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type,
      severity: severity || this.determineSeverity(type),
      source: 'API',
      userId: (req as any).user?.id,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      details,
      resolved: false
    };

    this.events.push(event);
    this.trimEvents();

    // Log to console/external system
    this.writeToLog(event);

    // Check for alert conditions
    this.checkAlertConditions(event);
  }

  /**
   * Log authentication failure
   */
  logAuthenticationFailure(req: Request, reason: string, attemptedEmail?: string): void {
    this.logSecurityEvent(
      SecurityEventType.AUTHENTICATION_FAILURE,
      req,
      {
        reason,
        attemptedEmail: attemptedEmail || 'unknown',
        timestamp: new Date().toISOString()
      },
      SecuritySeverity.MEDIUM
    );
  }

  /**
   * Log malicious input detection
   */
  logMaliciousInput(req: Request, inputType: string, pattern: string): void {
    this.logSecurityEvent(
      SecurityEventType.MALICIOUS_INPUT,
      req,
      {
        inputType,
        pattern,
        body: this.sanitizeForLogging(req.body),
        query: this.sanitizeForLogging(req.query),
        params: this.sanitizeForLogging(req.params)
      },
      SecuritySeverity.HIGH
    );
  }

  /**
   * Log file threat detection
   */
  logFileThreatDetected(req: Request, filename: string, threats: string[], fileHash: string): void {
    this.logSecurityEvent(
      SecurityEventType.FILE_THREAT_DETECTED,
      req,
      {
        filename,
        threats,
        fileHash,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype
      },
      SecuritySeverity.HIGH
    );
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(req: Request, limit: number, window: number): void {
    this.logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      req,
      {
        limit,
        window,
        endpoint: req.path
      },
      SecuritySeverity.MEDIUM
    );
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(req: Request, activity: string, details: Record<string, any> = {}): void {
    this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      req,
      {
        activity,
        ...details
      },
      SecuritySeverity.MEDIUM
    );
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filters: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    ip?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filters.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }

    if (filters.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
    }

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
    }

    if (filters.ip) {
      filteredEvents = filteredEvents.filter(event => event.ip === filters.ip);
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= filters.endDate!
      );
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filters.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents;
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    recentThreats: SecurityEvent[];
  } {
    const cutoffTime = new Date(Date.now() - timeRange);
    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) >= cutoffTime
    );

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentThreats = recentEvents
      .filter(event => event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL)
      .slice(0, 20);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      recentThreats
    };
  }

  /**
   * Mark security event as resolved
   */
  resolveSecurityEvent(eventId: string, resolvedBy: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.details.resolvedBy = resolvedBy;
      event.details.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine severity based on event type
   */
  private determineSeverity(type: SecurityEventType): SecuritySeverity {
    const severityMap: Record<SecurityEventType, SecuritySeverity> = {
      [SecurityEventType.AUTHENTICATION_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.AUTHORIZATION_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.MALICIOUS_INPUT]: SecuritySeverity.HIGH,
      [SecurityEventType.FILE_THREAT_DETECTED]: SecuritySeverity.HIGH,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.LOW,
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SECURITY_SCAN_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.INVALID_FILE_UPLOAD]: SecuritySeverity.LOW,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecuritySeverity.HIGH
    };

    return severityMap[type] || SecuritySeverity.MEDIUM;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection as any).socket?.remoteAddress ||
           'unknown';
  }

  /**
   * Write event to log
   */
  private writeToLog(event: SecurityEvent): void {
    const logEntry = {
      timestamp: event.timestamp,
      level: this.severityToLogLevel(event.severity),
      type: 'SECURITY_EVENT',
      eventType: event.type,
      severity: event.severity,
      userId: event.userId || 'anonymous',
      ip: event.ip,
      endpoint: event.endpoint,
      method: event.method,
      details: event.details
    };

    if (config.server.nodeEnv === 'production') {
      // In production, use structured logging
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, use readable format
      console.warn(`[SECURITY] ${event.severity} - ${event.type}:`, logEntry);
    }

    // Send to external monitoring system if configured
    if (event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH) {
      this.sendToMonitoringSystem(event);
    }
  }

  /**
   * Convert severity to log level
   */
  private severityToLogLevel(severity: SecuritySeverity): string {
    const levelMap: Record<SecuritySeverity, string> = {
      [SecuritySeverity.LOW]: 'info',
      [SecuritySeverity.MEDIUM]: 'warn',
      [SecuritySeverity.HIGH]: 'error',
      [SecuritySeverity.CRITICAL]: 'error'
    };

    return levelMap[severity];
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(event: SecurityEvent): void {
    const threshold = this.alertThresholds[event.type];
    if (!threshold) return;

    // Count recent events of the same type from the same IP
    const recentEvents = this.events.filter(e => 
      e.type === event.type &&
      e.ip === event.ip &&
      new Date(e.timestamp).getTime() > Date.now() - (15 * 60 * 1000) // Last 15 minutes
    );

    if (recentEvents.length >= threshold) {
      this.triggerAlert(event, recentEvents.length, threshold);
    }
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(event: SecurityEvent, count: number, threshold: number): void {
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_ALERT',
      eventType: event.type,
      severity: SecuritySeverity.CRITICAL,
      message: `Security threshold exceeded: ${count} ${event.type} events from IP ${event.ip} in 15 minutes (threshold: ${threshold})`,
      ip: event.ip,
      userId: event.userId,
      count,
      threshold
    };

    console.error('[SECURITY ALERT]', JSON.stringify(alert));
    
    // Send to alerting system
    this.sendAlert(alert);
  }

  /**
   * Send alert to external system
   */
  private sendAlert(alert: any): void {
    // In production, integrate with alerting systems like PagerDuty, Slack, etc.
    if (config.server.nodeEnv === 'production') {
      // TODO: Implement external alerting
      console.error('CRITICAL SECURITY ALERT - External notification would be sent:', alert);
    }
  }

  /**
   * Send event to monitoring system
   */
  private sendToMonitoringSystem(event: SecurityEvent): void {
    // In production, integrate with monitoring systems like DataDog, New Relic, etc.
    if (config.server.nodeEnv === 'production') {
      // TODO: Implement external monitoring
      console.log('High-severity security event - External monitoring would be notified:', event);
    }
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Trim events to prevent memory issues
   */
  private trimEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Export security events for analysis
   */
  exportSecurityEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'severity', 'ip', 'userId', 'endpoint', 'method'];
      const csvRows = [headers.join(',')];
      
      this.events.forEach(event => {
        const row = [
          event.timestamp,
          event.type,
          event.severity,
          event.ip,
          event.userId || '',
          event.endpoint,
          event.method
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }

    return JSON.stringify(this.events, null, 2);
  }
}

export const securityAuditService = new SecurityAuditService();