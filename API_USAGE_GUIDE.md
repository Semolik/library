# Руководство по использованию API после миграции Redis

## Быстрый старт

### 1. Установка зависимостей
```bash
cd apps/api
npm install
```

### 2. Запуск приложения
```bash
# Development
npm run dev

# Production
npm run build && npm run prod
```

### 3. Доступ к Swagger
```
http://localhost:3001/api
```

## Основные эндпоинты

### Регистрация (Публичный)
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "myusername",
  "password": "securePassword123"
}

Response (201):
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

### Вход (Публичный)
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

### Обновление токена (Публичный)
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}

Response (200):
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

### Получение профиля (Защищенный)
```bash
GET /auth/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "username": "myusername",
  "createdAt": "2026-04-10T12:00:00Z"
}
```

## Авторизация в Swagger

1. Откройте http://localhost:3001/api
2. Нажмите кнопку **"Authorize"** (верхний правый угол)
3. Введите Access Token в поле (без "Bearer")
4. Нажмите "Authorize"
5. Нажмите "Close"

Теперь все protected эндпоинты будут автоматически отправлять токен.

## Примеры на разных языках

### JavaScript/TypeScript
```typescript
// Регистрация
const response = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'myusername',
    password: 'securePassword123'
  })
});

const { accessToken, refreshToken, user } = await response.json();

// Получить профиль
const profileResponse = await fetch('http://localhost:3001/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const profile = await profileResponse.json();
```

### Python
```python
import requests

# Регистрация
response = requests.post(
    'http://localhost:3001/auth/register',
    json={
        'email': 'user@example.com',
        'username': 'myusername',
        'password': 'securePassword123'
    }
)

data = response.json()
access_token = data['accessToken']

# Получить профиль
profile = requests.get(
    'http://localhost:3001/auth/profile',
    headers={'Authorization': f'Bearer {access_token}'}
).json()
```

### cURL
```bash
# Регистрация
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"myusername","password":"securePassword123"}' \
  | jq -r '.accessToken')

# Получить профиль
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/library
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=library

# JWT (RS256 - асимметричная криптография)
# Используйте scripts/generate-async-crypto-keys.ts для генерации
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>
JWT_EXPIRATION=86400
JWT_REFRESH_EXPIRATION=7d
```

## Генерация JWT ключей

```bash
npm run gen-rsa-keys
```

Ключи будут сохранены в:
- `keys/private_key.pem` - приватный ключ
- `keys/public_key.pem` - публичный ключ
- `keys/private_key_base64.pem` - приватный ключ (base64)
- `keys/public_key_base64.pem` - публичный ключ (base64)

## Коды ошибок

| Код | Описание |
|-----|---------|
| 400 | Ошибка валидации (неверный email, короткий пароль и т.д.) |
| 401 | Неверные учётные данные или невалидный токен |
| 409 | Пользователь с таким email/username уже существует |
| 500 | Внутренняя ошибка сервера |

## Различия после миграции с Redis

### Что изменилось ✅
- ❌ Удалена зависимость от Redis
- ✅ Использование встроенного JavaScript Map для хранения токенов
- ✅ Проще для разработки и тестирования
- ✅ Нет необходимости запускать Redis контейнер

### Ограничения ⚠️
- 🚫 Токены хранятся только в памяти приложения
- 🚫 При перезагрузке приложения все токены теряются
- 🚫 Не подходит для multi-instance deployment

### Когда использовать Redis вновь?
- Если нужна персистентность токенов
- Если используется несколько инстансов приложения
- Если нужна клиентская сессия на стороне сервера

## Troubleshooting

### Ошибка: "JWT_PRIVATE_KEY environment variable is not set"
**Решение**: Установите переменные `JWT_PRIVATE_KEY` и `JWT_PUBLIC_KEY` в `.env`

```bash
npm run gen-rsa-keys
```

### Ошибка: "Invalid token"
**Решение**: Убедитесь, что вы передаете корректный Access Token в заголовке Authorization

### Ошибка: "Невалидный refresh token"
**Решение**: Refresh token истек или неверен. Попробуйте снова зарегистрироваться или войти

---

**Дополнительная информация**: см. [REDIS_REMOVAL_MIGRATION.md](./REDIS_REMOVAL_MIGRATION.md)

