import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

// ================================================================
// Structured JSON logging interceptor
// Every request logs: method, path, statusCode, duration, userId, ip
// Compatible with CloudWatch / Datadog log aggregators.
// ================================================================

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { user?: { id?: string } }>();
    const { method, url, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const duration = Date.now() - startTime;
          this.logger.log(
            JSON.stringify({
              level: 'info',
              method,
              path: url,
              statusCode: response.statusCode,
              duration,
              userId: request.user?.id ?? null,
              ip,
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              level: 'error',
              method,
              path: url,
              duration,
              userId: request.user?.id ?? null,
              ip,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
