'use client';

import { z } from 'zod';
import { toast } from 'sonner';

/**
 * Утилита для работы с API и обработкой ошибок валидации
 */

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message?: string,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
  }
}

/**
 * Делает API запрос с автоматической обработкой ошибок
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || 'API Error',
      data.errors,
    );
  }

  return data;
}

/**
 * Отправляет данные на API с валидацией Zod
 */
export async function apiSubmitForm<T extends Record<string, string | number | boolean>>(
  url: string,
  data: T,
  schema: z.ZodSchema,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<unknown> {
  // Валидируем данные перед отправкой
  const validatedData = await schema.parseAsync(data);

  return apiRequest(url, {
    method,
    body: JSON.stringify(validatedData),
  });
}

/**
 * Обрабатывает ошибку API и преобразует её в формат формы с выводом через toast
 */
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    const formError = error.message || 'Ошибка при обработке запроса';
    const fieldErrors = error.errors || {};

    // Выводим основную ошибку через toast
    toast.error(formError, {
      description: Object.entries(fieldErrors).length > 0
        ? Object.entries(fieldErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n')
        : undefined,
    });

    return {
      formError,
      fieldErrors,
    };
  }

  if (error instanceof Error) {
    const message = error.message;

    // Выводим ошибку через toast
    toast.error('Ошибка', {
      description: message,
    });

    return {
      formError: message,
      fieldErrors: {},
    };
  }

  const formError = 'Произошла неожиданная ошибка';

  // Выводим неожиданную ошибку через toast
  toast.error(formError);

  return {
    formError,
    fieldErrors: {},
  };
}
