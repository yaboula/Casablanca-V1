import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// ================================================================
// Global exception filter — guarantees the client NEVER receives
// a raw stack trace or unformatted error object.
//
// Unified error shape:
// {
//   statusCode: number,
//   message: string,
//   errors?: string[],       // validation field errors
//   timestamp: string,
//   path: string
// }
// ================================================================

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) ?? message;
        if (Array.isArray(resp.message)) {
          errors = resp.message as string[];
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // PostgreSQL constraint violations
      const pgError = exception as QueryFailedError & { code?: string; detail?: string };

      if (pgError.code === '23505') {
        // Unique violation
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      } else if (pgError.code === '23503') {
        // Foreign key violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource does not exist';
      } else {
        this.logger.error('Database error', pgError.message, pgError.stack);
      }
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled error', exception.message, exception.stack);
    }

    const body = {
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}
