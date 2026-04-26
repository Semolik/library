# Shared Types

Пакет с общими типами данных и DTO для использования на фронтенде и бекенде.

## Экспорты

### Enums
- `RoleEnum` - Роли пользователей (SUPERUSER, ADMIN, USER)
- `PermissionEnum` - Перечисление всех доступных прав доступа

### DTOs
- `UserRegisterDto` - DTO для регистрации
- `UserLoginDto` - DTO для входа
- `UserDto` - DTO профиля пользователя
- `UserWithTokenDto` - DTO профиля с JWT токеном
- `RoleDto` - DTO роли
- `PermissionDto` - DTO права доступа
- `JwtPayloadDto` - DTO JWT payload

## Использование

```typescript
import { UserRegisterDto, RoleEnum, PermissionEnum } from '@workspace/shared-types';

const registerData: UserRegisterDto = {
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
};

if (user.roles.includes(RoleEnum.ADMIN)) {
  // User is admin
}
```

