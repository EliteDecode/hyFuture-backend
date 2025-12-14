import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: MyLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const startedAt = Date.now();

    this.logger.debug(
      `Incoming ${method} ${url} -> ${controller}.${handler}`,
      controller,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        this.logger.log(
          `${method} ${url} -> ${res.statusCode} (${duration}ms)`,
          controller,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startedAt;
        this.logger.error(
          `${method} ${url} failed after ${duration}ms`,
          error?.stack,
          controller,
        );
        return throwError(() => error);
      }),
    );
  }
}
