'use client';

import React, { useState } from 'react';
import { DtoForm } from '@/components/dto-form';
import { useDtoForm } from '@/hooks';
import { useFormFieldsFromSchema } from '@/hooks/useFormFieldsFromSchema';
import {
  LoginUserSchema,
  type LoginUserFormData,
  type TokenResponse,
} from '@workspace/contracts/auth';
import { apiRequest, handleApiError } from '@/lib/api';
import { useAuth } from './auth-context';

/**
 * Компонент формы логина с shadcn/ui компонентами
 * Использует единый Zod-контракт для валидации и UI полей
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const form = useDtoForm(LoginUserSchema, {
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const fields = useFormFieldsFromSchema(LoginUserSchema);

  const onSubmit = async (data: LoginUserFormData) => {
    try {
      setIsLoading(true);

      // Валидируем данные перед отправкой
      const validatedData = await LoginUserSchema.parseAsync(data);
      const result = await apiRequest<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validatedData),
      });

      signIn(result);
      form.reset();
    } catch (err) {
      // handleApiError выведет ошибку через sonner
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DtoForm
      form={form}
      fields={fields}
      config={{
        title: 'Вход в систему',
        description: 'Введите ваши учетные данные для входа',
        submitText: 'Войти',
        submitLoadingText: 'Вход...',
        className: 'w-full',
      }}
      onSubmit={onSubmit}
      isLoading={isLoading}
      showCard={true}
    />
  );
}
