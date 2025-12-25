import { Injectable } from '@angular/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private shouldLog(level: LogLevel): boolean {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      return true;
    }
    return level === 'warn' || level === 'error';
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(message, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    console.error(message, error, ...args);
  }
}
