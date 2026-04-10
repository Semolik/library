import type { LoginUserFormData } from '@workspace/contracts/auth';

export type BaseUserDto = Pick<LoginUserFormData, 'email'>;
