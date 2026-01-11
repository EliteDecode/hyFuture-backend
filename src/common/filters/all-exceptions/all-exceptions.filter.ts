import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
// import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';

type MyResponseObj = {
  success: boolean;
  message: string;
  data: any;
  statusCode: number;
  timestamp: string;
  path: string;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new MyLoggerService(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorResponse: any = null;
    let data: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message =
          responseObj.message || exception.message || 'An error occurred';
        errorResponse = responseObj;

        // Extract extra data (excluding standard NestJS error fields)
        const {
          message: _,
          statusCode: __,
          error: ___,
          ...extraData
        } = responseObj;
        if (Object.keys(extraData).length > 0) {
          data = extraData;
        }
      } else {
        message = exception.message || 'An error occurred';
      }
    }

    const myResponseObj: MyResponseObj = {
      success: false,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(myResponseObj);

    this.logger.error(
      message,
      errorResponse?.stack || '',
      AllExceptionsFilter.name,
    );

    super.catch(exception, host);
  }
}
