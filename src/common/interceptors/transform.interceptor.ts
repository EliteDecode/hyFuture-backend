import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { API_MESSAGES_REGISTRY } from '../constants/api-messages.registry';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    // NO_CONTENT (204) should not have a body
    // if (statusCode === HttpStatus.NO_CONTENT) {
    //   return next.handle();
    // }

    return next.handle().pipe(
      map((data) => {
        let message = this.getMessage(context, statusCode);
        let finalData = data;

        // If data contains a message, use it and clean up data
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          const { message: _, ...rest } = data;
          finalData = Object.keys(rest).length > 0 ? rest : null;
        }

        return {
          success: true,
          message,
          data: finalData,
          statusCode,
        };
      }),
    );
  }

  private getMessage(context: ExecutionContext, statusCode: number): string {
    const handler = context.getHandler().name;
    const method = context.switchToHttp().getRequest().method;

    // Get message from registry, fallback to generic message
    return (
      API_MESSAGES_REGISTRY[handler] ||
      `${method} request completed successfully`
    );
  }
}
