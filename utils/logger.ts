type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  private formatLog(entry: LogEntry): string {
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      critical: "🚨",
    }[entry.level];
    
    const context = entry.context ? `[${entry.context}]` : "";
    const userId = entry.userId ? `[User: ${entry.userId.slice(0, 8)}]` : "";
    
    return `${emoji} ${entry.timestamp} ${context}${userId} ${entry.message}`;
  }
  
  private addToBuffer(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    return ["warn", "error", "critical"].includes(level);
  }
  
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };
    
    this.addToBuffer(entry);
    
    if (this.shouldLog("debug")) {
      console.log(this.formatLog(entry), metadata || "");
    }
  }
  
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };
    
    this.addToBuffer(entry);
    
    if (this.shouldLog("info")) {
      console.info(this.formatLog(entry), metadata || "");
    }
  }
  
  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };
    
    this.addToBuffer(entry);
    
    if (this.shouldLog("warn")) {
      console.warn(this.formatLog(entry), metadata || "");
    }
  }
  
  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
      error,
    };
    
    this.addToBuffer(entry);
    
    if (this.shouldLog("error")) {
      console.error(this.formatLog(entry), error || "", metadata || "");
    }
  }
  
  critical(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "critical",
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
      error,
    };
    
    this.addToBuffer(entry);
    
    console.error(`🚨🚨🚨 CRITICAL: ${this.formatLog(entry)}`, error || "", metadata || "");

    // TODO: Integrate with Sentry or BugSnag here
    // if (Sentry) {
    //   Sentry.captureException(error || new Error(message), { extra: { context, metadata } });
    // }
  }
  
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }
  
  clearLogs(): void {
    this.logs = [];
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

export function logAuthEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
  logger.info(event, "Auth", { ...metadata, userId });
}

export function logFirestoreOperation(
  operation: string,
  collection: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  if (success) {
    logger.debug(`${operation} ${collection}`, "Firestore", metadata);
  } else {
    logger.error(`Failed: ${operation} ${collection}`, undefined, "Firestore", metadata);
  }
}

export function logPerformance(operation: string, durationMs: number, metadata?: Record<string, any>): void {
  const level = durationMs > 1000 ? "warn" : "debug";
  if (level === "warn") {
    logger.warn(`Slow operation: ${operation} (${durationMs}ms)`, "Performance", metadata);
  } else {
    logger.debug(`${operation} (${durationMs}ms)`, "Performance", metadata);
  }
}

export default logger;
