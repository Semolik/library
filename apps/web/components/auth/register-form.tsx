'use client';

import React, { useState } from 'react';
import { DtoForm } from '@/components/dto-form';
import { useDtoForm } from '@/hooks';
import { useFormFieldsFromSchema } from '@/hooks/useFormFieldsFromSchema';
import {
  CreateUserSchema,
  type CreateUserFormData,
  type TokenResponse,
} from '@workspace/contracts/auth';
import { apiRequest, handleApiError } from '@/lib/api';
import { useAuth } from './auth-context';

/**
 * Компонент формы регистрации с shadcn/ui компонентами
 * Использует единый Zod-контракт для валидации и UI полей
 */
export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const form = useDtoForm(CreateUserSchema, {
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const fields = useFormFieldsFromSchema(CreateUserSchema);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsLoading(true);

      // Валидируем данные перед отправкой
      const validatedData = await CreateUserSchema.parseAsync(data);
      const result = await apiRequest<TokenResponse>('/api/auth/register', {
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
        title: 'Создание аккаунта',
        description: 'Заполните форму для регистрации',
        submitText: 'Зарегистрироваться',
        submitLoadingText: 'Регистрация...',
        className: 'w-full',
      }}
      onSubmit={onSubmit}
      isLoading={isLoading}
      showCard={true}
    />
  );
}
