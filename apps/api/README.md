# Library API

NestJS API для управления библиотекой с системой авторизации, ролей и прав доступа.

## Архитектура

Проект использует модульную архитектуру:

```
src/
├── config/           # Конфигурация приложения
├── modules/          # Бизнес-логика
│   ├── auth/         # Аутентификация и авторизация
│   ├── user/         # Управление пользователями
│   └── security/     # Роли и права доступа
├── common/           # Общие компоненты (будет расширено)
└── main.ts          # Точка входа
```

## Модули

### Auth Module
- Регистрация и вход
- JWT токены
- Декораторы для ролей и прав доступа
- Guards для проверки доступа

### User Module
- Управление профилем пользователя
- Получение текущего пользователя

### Security Module
- Роли (SUPERUSER, ADMIN, USER)
- Права доступа
- Управление связями между ролями и правами

## Установка

```bash
# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
```

## Настройка БД

```bash
# Запустить PostgreSQL в Docker
docker-compose up -d

# Инициализировать БД (заполнить роли, права и создать superuser)
npm run db:seed
```

## Запуск

```bash
# Режим разработки
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Аутентификация
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Получить текущего пользователя

### Пользователи
- `GET /users/me` - Профиль текущего пользователя

## Использование декораторов

```typescript
@Controller('protected')
export class ProtectedController {
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERUSER', 'ADMIN')
  async adminOnly(@CurrentUser() user: JwtPayloadDto) {
    return { message: 'Only admins can see this' };
  }

  @Get('with-permission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('USER_READ', 'USER_UPDATE')
  async withPermission(@CurrentUser() user: JwtPayloadDto) {
    return { message: 'User has required permissions' };
  }
}
```

## Структура DTO

Все DTO хранятся в `packages/shared-types` для переиспользования на фронтенде:
- `UserRegisterDto` - Регистрация
- `UserLoginDto` - Вход
- `UserDto` - Профиль пользователя
- `UserWithTokenDto` - Профиль с токеном
- `RoleDto` - Роль
- `PermissionDto` - Право доступа
- `JwtPayloadDto` - Payload JWT токена

## Примеры запросов

### Регистрация
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Вход
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Получить профиль
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment переменные

Смотрите `.env.example` для полного списка переменных.

## Разработка

```bash
# Линтинг
npm run lint

# Форматирование
npm run format

# Type checking
npm run typecheck

# Тесты
npm run test
```

