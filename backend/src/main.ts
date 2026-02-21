import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// ================================================================
// NEXUS Backend — NestJS Application Bootstrap
// ================================================================

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Disable default logger — we use structured JSON logging
    bufferLogs: true,
    rawBody: true, // Required for Stripe webhook signature verification
  });

  // ── Globals ────────────────────────────────────────────────
  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // ── Security ───────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false,       // Next.js handles CSP
      crossOriginEmbedderPolicy: false,   // Required for some browser APIs
    }),
  );

  // ── CORS ───────────────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3600',
        'http://localhost:4000',
        'http://localhost:3900',
      ].filter(Boolean) as string[];
      // In development, allow any localhost or 127.0.0.1 origin regardless of port
      const isLocalhost =
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
      if (isLocalhost || allowed.includes(origin!)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Validation ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown fields
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Exception Filter ───────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Logging ────────────────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Swagger / OpenAPI (dev + staging only) ───────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NEXUS Backend API')
      .setDescription(
        'Premium car-rental platform API — serves both customer app and operator panel.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication & registration')
      .addTag('reservations', 'Booking lifecycle')
      .addTag('vehicles', 'Vehicle catalog')
      .addTag('documents', 'Document upload (presigned S3)')
      .addTag('operator', 'Operator panel endpoints')
      .addTag('chat', 'Support chat')
      .addTag('webhooks', 'Stripe webhook receiver')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📖 Swagger docs available at /${apiPrefix}/docs`);
  }

  // ── Start ──────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);

  logger.log(`🚀 NEXUS Backend running on port ${port}`);
  logger.log(`📍 API prefix: /${apiPrefix}`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
