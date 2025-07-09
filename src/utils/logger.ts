export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = this.getLogLevelFromEnv() || logLevel;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    let logMessage = `[${timestamp}] ${levelName}: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` | ${JSON.stringify(metadata)}`;
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, metadata);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  /**
   * Log an error message
   */
  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log HTTP request information
   */
  logRequest(method: string, url: string, statusCode: number, responseTime: number): void {
    this.info(`${method} ${url}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  /**
   * Log application startup information
   */
  logStartup(port: number, environment: string): void {
    this.info('🚀 Task Management API started', {
      port,
      environment,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database operation (for future use with actual DB)
   */
  logDatabaseOperation(operation: string, collection: string, duration: number): void {
    this.debug(`Database operation: ${operation}`, {
      collection,
      duration: `${duration}ms`,
    });
  }

  /**
   * Set the log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Create and export a singleton logger instance
export const logger = new Logger();

// Export the Logger class for testing or custom instances
export { Logger };

export default logger;
