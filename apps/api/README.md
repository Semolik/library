# API - NestJS Server с модульной архитектурой

Полнофункциональный NestJS API сервер с JWT аутентификацией, работой с Prisma ORM и модульной архитектурой.

## 🚀 Быстрый старт

### 1. Установить зависимости
```bash
npm install
```

### 2. Настроить переменные окружения
```bash
cp .env.example .env
# Отредактируйте .env с вашими значениями (особенно DATABASE_URL)
```

### 3. Инициализировать БД
```bash
npm run db:migrate
```

### 4. Запустить сервер
```bash
npm run dev
```

Сервер запустится на `http://localhost:3001`

## 📚 Документация

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Подробное описание модульной архитектуры
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Визуальные диаграммы архитектуры
- **[QUICK_START.md](./QUICK_START.md)** - Быстрый старт и примеры API
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Инструкции по настройке PostgreSQL

## 🔧 Команды

```bash
# Разработка
npm run dev              # Запуск в режиме разработки с hot-reload
npm run build            # Компилирование TypeScript в JavaScript
npm start                # Запуск production сервера
npm run typecheck        # Проверка типов TypeScript
npm run lint             # Проверка кода ESLint

# База данных
npm run db:migrate       # Создать и применить миграцию
npm run db:push          # Push схемы в БД без миграций
npm run db:generate      # Регенерировать Prisma клиент
npm run db:seed          # Выполнить seed скрипт
npm run db:reset         # Сбросить БД (ОСТОРОЖНО!)

# Тестирование API
bash test-api.sh         # Запустить набор тестов API
```

## 🏗️ Структура проекта

```
src/
├── common/                     # Общие компоненты
│   ├── decorators/            # Custom декораторы
│   ├── exceptions/            # Custom исключения
│   ├── guards/                # Авторизационные guards
│   │   └── jwt-auth.guard.ts
│   ├── strategies/            # Passport стратегии
│   │   └── jwt.strategy.ts
│   ├── services/              # Общие сервисы
│   │   └── prisma.service.ts
│   └── index.ts
├── config/                    # Конфигурация приложения
│   └── config.service.ts      # Управление env переменными
├── modules/                   # Модули функционала
│   ├── auth/                  # Модуль аутентификации
│   │   ├── controllers/       # REST endpoints
│   │   ├── services/          # Business logic
│   │   ├── schemas/           # DTO для валидации
│   │   ├── entities/          # Типы и интерфейсы
│   │   ├── auth.module.ts
│   │   └── index.ts
│   └── index.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts              # Главный модуль приложения
└── main.ts                    # Entry point

prisma/
├── schema.prisma              # Prisma ORM схема БД
└── seed.ts                    # Seed скрипт для инициализации

.env                          # Переменные окружения (не коммитить)
.env.example                  # Пример переменных
```

## 🔐 API Endpoints

### Health Check
```http
GET /api/health
```

### Аутентификация

#### Регистрация
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123"
}

Response 201:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser"
  }
}
```

#### Вход
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200: (аналогично регистрации)
```

#### Обновить токен
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200: (новая пара токенов)
```

#### Профиль (защищено)
```http
GET /auth/profile
Authorization: Bearer eyJhbGc...

Response 200:
{
  "id": 1,
  "email": "user@example.com",
  "username": "testuser",
  "createdAt": "2026-04-05T10:30:00Z"
}
```

## 🛠️ Технологический стек

- **NestJS 11+** - Progressive Node.js framework
- **Prisma 5+** - Next-generation ORM
- **PostgreSQL** - Реляционная БД
- **JWT** - JSON Web Tokens для аутентификации
- **Passport** - Authentication middleware
- **Bcrypt** - Password hashing
- **class-validator** - DTO валидация
- **class-transformer** - DTO трансформация
- **TypeScript** - Type-safe JavaScript

## 📦 Добавление нового модуля

1. Создайте папку в `src/modules/<module-name>`
2. Структурируйте как Auth модуль:
```
<module-name>/
├── controllers/
│   └── <module-name>.controller.ts
├── services/
│   └── <module-name>.service.ts
├── schemas/
│   ├── create-<item>.dto.ts
│   └── update-<item>.dto.ts
├── entities/
│   └── <item>.interface.ts
├── <module-name>.module.ts
└── index.ts
```

3. Экспортируйте компоненты из `index.ts`
4. Импортируйте модуль в `app.module.ts`

## 🔒 Безопасность

- Пароли хешируются с bcrypt (salt rounds = 10)
- JWT токены подписаны и верифицируются
- Access Token: 1 час по умолчанию
- Refresh Token: 7 дней по умолчанию
- CORS настроен для фронтенда (localhost:3000)
- Валидация всех входящих данных через DTO

## 🐛 Troubleshooting

### "Database connection refused"
Убедитесь, что PostgreSQL запущен и DATABASE_URL в `.env` верна:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### "Could not find generated Prisma Client"
```bash
npm run db:generate
```

### Порт 3001 уже используется
Измените PORT в `.env` или завершите процесс на порту 3001

---

**Последнее обновление:** 05.04.2026

- `GET /api/health` - проверка здоровья приложения

## Структура

```
src/
├── main.ts           # Точка входа приложения
├── app.module.ts     # Главный модуль
├── app.controller.ts # Контроллеры маршрутов
└── app.service.ts    # Бизнес-логика
```

