import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  private format(level: string, message: any, context?: string) {
    const payload = {
      level,
      timestamp: new Date().toISOString(),
      context: context || this.context,
      message,
    };
    return JSON.stringify(payload);
  }

  log(message: any, context?: string): void {
    super.log(this.format('log', message, context));
  }

  error(message: any, stack?: string, context?: string): void {
    super.error(this.format('error', stack ? `${message} | ${stack}` : message, context));
  }

  warn(message: any, context?: string): void {
    super.warn(this.format('warn', message, context));
  }

  debug(message: any, context?: string): void {
    super.debug?.(this.format('debug', message, context));
  }

  verbose(message: any, context?: string): void {
    super.verbose?.(this.format('verbose', message, context));
  }
}
