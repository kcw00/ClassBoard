import config from '../config';

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface AlertData {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  service: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private alerts: AlertData[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly maxAlertsHistory = 500;

  // Record a metric
  recordMetric(data: Omit<MetricData, 'timestamp'>): void {
    const metric: MetricData = {
      ...data,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log metric in structured format for external monitoring systems
    if (config.server.nodeEnv === 'production') {
      console.log(JSON.stringify({
        timestamp: metric.timestamp.toISOString(),
        level: 'info',
        type: 'metric',
        metric: metric,
      }));
    }
  }

  // Send an alert
  sendAlert(data: Omit<AlertData, 'timestamp'>): void {
    const alert: AlertData = {
      ...data,
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }

    // Log alert in structured format
    const logLevel = alert.level === 'critical' || alert.level === 'error' ? 'error' : 'warn';
    console[logLevel](JSON.stringify({
      timestamp: alert.timestamp.toISOString(),
      level: alert.level,
      type: 'alert',
      alert: alert,
    }));

    // In production, you would send this to external alerting systems
    // like PagerDuty, Slack, email, etc.
    if (config.server.nodeEnv === 'production' && alert.level === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  // Get recent metrics
  getMetrics(limit: number = 100): MetricData[] {
    return this.metrics.slice(-limit);
  }

  // Get recent alerts
  getAlerts(limit: number = 50): AlertData[] {
    return this.alerts.slice(-limit);
  }

  // Get metrics by name
  getMetricsByName(name: string, limit: number = 100): MetricData[] {
    return this.metrics
      .filter(metric => metric.name === name)
      .slice(-limit);
  }

  // Get system health metrics
  getSystemMetrics(): Record<string, any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        heapUsedPercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        // Add event loop lag monitoring if needed
      },
    };
  }

  // Monitor system resources and send alerts if thresholds are exceeded
  monitorSystemResources(): void {
    const metrics = this.getSystemMetrics();

    // Memory usage alert
    if (metrics.memory.heapUsedPercentage > 90) {
      this.sendAlert({
        level: 'critical',
        message: `High memory usage: ${metrics.memory.heapUsedPercentage.toFixed(2)}%`,
        service: 'system',
        metadata: { memoryUsage: metrics.memory },
      });
    } else if (metrics.memory.heapUsedPercentage > 80) {
      this.sendAlert({
        level: 'warning',
        message: `Elevated memory usage: ${metrics.memory.heapUsedPercentage.toFixed(2)}%`,
        service: 'system',
        metadata: { memoryUsage: metrics.memory },
      });
    }

    // Record system metrics
    this.recordMetric({
      name: 'system.memory.heap_used_percentage',
      value: metrics.memory.heapUsedPercentage,
      unit: 'percent',
    });

    this.recordMetric({
      name: 'system.uptime',
      value: metrics.uptime,
      unit: 'seconds',
    });
  }

  // Monitor API response times
  recordApiResponseTime(method: string, path: string, responseTime: number, statusCode: number): void {
    this.recordMetric({
      name: 'api.response_time',
      value: responseTime,
      unit: 'milliseconds',
      tags: {
        method,
        path,
        status_code: statusCode.toString(),
      },
    });

    // Alert on slow responses
    if (responseTime > 5000) {
      this.sendAlert({
        level: 'critical',
        message: `Very slow API response: ${method} ${path} took ${responseTime}ms`,
        service: 'api',
        metadata: { method, path, responseTime, statusCode },
      });
    } else if (responseTime > 2000) {
      this.sendAlert({
        level: 'warning',
        message: `Slow API response: ${method} ${path} took ${responseTime}ms`,
        service: 'api',
        metadata: { method, path, responseTime, statusCode },
      });
    }
  }

  // Monitor error rates
  recordApiError(method: string, path: string, statusCode: number, error: string): void {
    this.recordMetric({
      name: 'api.error_count',
      value: 1,
      unit: 'count',
      tags: {
        method,
        path,
        status_code: statusCode.toString(),
      },
    });

    // Alert on 5xx errors
    if (statusCode >= 500) {
      this.sendAlert({
        level: 'error',
        message: `Server error: ${method} ${path} returned ${statusCode}`,
        service: 'api',
        metadata: { method, path, statusCode, error },
      });
    }
  }

  // Start periodic system monitoring
  startSystemMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.monitorSystemResources();
    }, intervalMs);

    console.log(`System monitoring started with ${intervalMs}ms interval`);
  }

  // Send critical alerts to external systems (placeholder)
  private sendCriticalAlert(alert: AlertData): void {
    // In a real implementation, this would integrate with:
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
    // - SMS alerts
    // - AWS SNS
    // etc.

    console.error('CRITICAL ALERT - External notification would be sent:', {
      alert,
      // Add integration details here
    });
  }

  // Clear all metrics and alerts (for testing)
  clearAll(): void {
    this.metrics.length = 0;
    this.alerts.length = 0;
  }

  // Get aggregated metrics for dashboards
  getAggregatedMetrics(timeRangeMinutes: number = 60): Record<string, any> {
    const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    const aggregated: Record<string, any> = {};

    // Group metrics by name
    const metricsByName = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate aggregations
    Object.entries(metricsByName).forEach(([name, values]) => {
      aggregated[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        sum: values.reduce((sum, val) => sum + val, 0),
      };
    });

    return aggregated;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Start system monitoring when the service is imported
if (config.server.nodeEnv === 'production') {
  monitoringService.startSystemMonitoring();
}