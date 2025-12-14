import { Injectable, ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class MyLoggerService extends ConsoleLogger {
  private readonly dateFormatter = Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  private async ensureLogDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      await fsPromises.mkdir(dirPath, { recursive: true });
    }
  }

  private getLogFilePath(currentDate: Date) {
    const logDir = path.join(process.cwd(), 'logs');
    const dateStamp = currentDate.toISOString().split('T')[0];
    const fileName = `${dateStamp}.log`;
    return { logDir, filePath: path.join(logDir, fileName) };
  }

  private serializeMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private formatEntry(
    level: string,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const timestamp = this.dateFormatter.format(new Date());
    const parts = [timestamp, level.toUpperCase()];

    if (context) {
      parts.push(context);
    }

    parts.push(this.serializeMessage(message));

    if (stack) {
      parts.push(stack);
    }

    return parts.join('\t') + '\n';
  }

  private async logToFile(entry: string, currentDate: Date = new Date()) {
    try {
      const { logDir, filePath } = this.getLogFilePath(currentDate);
      await this.ensureLogDir(logDir);
      await fsPromises.appendFile(filePath, entry);
    } catch (e) {
      if (e instanceof Error) {
        console.error('Failed to write to log file:', e.message);
      }
    }
  }

  private persist(
    level: string,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const entry = this.formatEntry(level, message, context, stack);
    this.logToFile(entry).catch((err) => {
      console.error('Failed to write to log file:', err);
    });
  }

  log(message: any, context?: string) {
    this.persist('log', message, context);
    super.log(message, context);
  }

  error(message: any, stack?: string, context?: string) {
    this.persist('error', message, context, stack);
    super.error(message, stack, context);
  }

  warn(message: any, context?: string) {
    this.persist('warn', message, context);
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    this.persist('debug', message, context);
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.persist('verbose', message, context);
    super.verbose(message, context);
  }
}
