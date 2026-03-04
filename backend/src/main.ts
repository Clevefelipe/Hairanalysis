import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from './logger/app-logger.service';
import { legalTermsSanitizerMiddleware } from './common/middleware/legal-terms-sanitizer.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.setGlobalPrefix('api');

  // Security
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(legalTermsSanitizerMiddleware);

  // CORS
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
  ];
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Hair Analysis System API')
    .setDescription(
      'API profissional para análise capilar e tricológica assistida por IA',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('vision', 'Análise por Imagem')
    .addTag('history', 'Histórico de Análises')
    .addTag('knowledge', 'Base de Conhecimento')
    .addTag('straightening', 'Alisamentos')
    .addTag('clients', 'Clientes')
    .addTag('salon', 'Salões')
    .build();

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`🚀 Servidor rodando na porta ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`);
  }
  logger.log(`💚 Health check: http://localhost:${port}/api/health`);
}

void bootstrap();
