import * as dotenv from 'dotenv';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@config/config.service';

// Загружаем переменные окружения до инициализации приложения
// Ищем в корне проекта (выше на 2 уровня от src/)
const projectRoot = path.join(process.cwd(), '../../../');
const envFile = path.join(projectRoot, '.env');
dotenv.config({ path: envFile });
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Убеждаемся что DATABASE_URL установлена
  if (!process.env.DATABASE_URL) {
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || 'postgres';
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = process.env.POSTGRES_PORT || '5432';
    const db = process.env.POSTGRES_DB || 'library';
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${db}`;
  }

  logger.log('🔧 Initializing NestJS application...');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Глобальная валидация с использованием class-validator
  app.useGlobalPipes(new ValidationPipe());

  // Включение CORS для фронтенда
  app.enableCors({
    origin: configService.corsOrigin,
    credentials: true,
  });

  // Инициализация Swagger
  const config = new DocumentBuilder()
    .setTitle('Library API')
    .setDescription('REST API для управления библиотекой')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Аутентификация и авторизация')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const PORT = configService.port;

  await app.listen(PORT);
  logger.log(`✓ NestJS API server running on http://localhost:${PORT}`);
  logger.log(`✓ Swagger UI available at http://localhost:${PORT}/api`);
}

bootstrap().catch((error) => {
  console.error('✗ Failed to start application:', error);
  process.exit(1);
});

