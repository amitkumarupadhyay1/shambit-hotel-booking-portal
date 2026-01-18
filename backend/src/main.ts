import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Import middleware with require for compatibility
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Request logging middleware for debugging
  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.url} - ${req.ip}`);
    next();
  });

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:3000'),
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Health check endpoint (outside of global prefix)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  const port = configService.get('PORT', 3002);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`🌐 Also accessible via local IP on port ${port}`);
  logger.log(`🏥 Health check available at: http://localhost:${port}/health`);
}

bootstrap();