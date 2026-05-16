import {
  IsEmail,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Exclude, Type } from 'class-transformer';

export class UserRegisterDto {
  @IsEmail({}, { message: 'Некорректный формат email.' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой.' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов.' })
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class UserLoginDto {
  @IsEmail({}, { message: 'Некорректный формат email.' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой.' })
  password: string;
}

export class UserUpdateDto {
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой.' })
  lastName?: string;
}

export class UserDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsOptional()
  roles?: RoleDto[];

  createdAt: Date;
  updatedAt: Date;
}

export class UserWithTokenDto extends UserDto {
  accessToken: string;
}

export class RoleDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  permissions?: PermissionDto[];

  createdAt: Date;
  updatedAt: Date;
}

export class PermissionDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

export class JwtPayloadDto {
  @IsUUID()
  sub: string;

  @IsEmail()
  email: string;

  roles: string[];
}

/** PATCH /library/settings — хотя бы одно поле должно быть передано (проверка в сервисе). */
export class UpdateLibrarySettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Срок выдачи укажите целым числом дней.' })
  @Min(1, { message: 'Срок выдачи: от 1 дня.' })
  @Max(1095, { message: 'Срок выдачи: не более 1095 дней.' })
  defaultLoanDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Штраф за день укажите целым числом рублей.' })
  @Min(0, { message: 'Штраф за день не может быть отрицательным.' })
  @Max(1_000_000, { message: 'Штраф за день слишком велик.' })
  finePerOverdueDay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Отсрочку укажите целым числом дней.' })
  @Min(0, { message: 'Отсрочка не может быть отрицательной.' })
  @Max(365, { message: 'Отсрочка не более 365 дней.' })
  fineGraceDays?: number;
}

export class PayRentFineDto {
  @Type(() => Number)
  @IsInt({ message: 'Сумма оплаты — целое число рублей.' })
  @Min(1, { message: 'Минимальная сумма оплаты 1 ₽.' })
  fineAmount: number;
}

