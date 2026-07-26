/**
 * Logging Infrastructure
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

class ConsoleLogger implements Logger {
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: unknown): void {
    console.info(`[INFO] ${message}`, data || '');
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data || '');
  }
}

export const logger = new ConsoleLogger();
