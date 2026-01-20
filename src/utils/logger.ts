/**
 * Streamlined logging utility
 * Only outputs critical information to reduce noise
 */

type LogLevel = "info" | "warn" | "error";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === "production") {
      return level === "error"; // Only output errors in production
    }
    // Development environment can control whether to output detailed logs
    if (process.env.QUIET_LOGS === "true") {
      return level === "error";
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  info(message: string, data?: unknown) {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: unknown) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, error?: Error | unknown) {
    if (this.shouldLog("error")) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(this.formatMessage("error", message, { error: errorMessage }));
    }
  }

  // HTTP request logging (streamlined version)
  http(method: string, path: string, status: number, duration?: number) {
    if (!this.shouldLog("info")) return;
    
    const statusColor = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
    const resetColor = "\x1b[0m";
    const durationStr = duration ? ` ${duration}ms` : "";
    
    console.log(
      `${statusColor}${method}${resetColor} ${path} ${statusColor}${status}${resetColor}${durationStr}`
    );
  }
}

export const logger = new Logger();
