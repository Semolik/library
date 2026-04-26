import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

const VALIDATION_MESSAGE_MAP: Record<string, string> = {
  'email must be an email': 'Некорректный формат email.',
  'password must be longer than or equal to 8 characters':
    'Пароль должен быть не короче 8 символов.',
  'password must be a string': 'Пароль должен быть строкой.',
  'email should not be empty': 'Email обязателен.',
  'password should not be empty': 'Пароль обязателен.',
};

function toRussianValidationMessage(message: string) {
  return VALIDATION_MESSAGE_MAP[message] ?? message;
}

function collectValidationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const current = Object.values(error.constraints ?? {}).map(toRussianValidationMessage);
    const nested = error.children?.length ? collectValidationMessages(error.children) : [];
    return [...current, ...nested];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvironmentVariables);
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = collectValidationMessages(errors);
        return new BadRequestException(
          messages.length > 0 ? messages : ['Ошибка валидации входных данных.'],
        );
      },
    }),
  );

  await app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap();

