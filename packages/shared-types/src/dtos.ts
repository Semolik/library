import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { Exclude } from 'class-transformer';

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

