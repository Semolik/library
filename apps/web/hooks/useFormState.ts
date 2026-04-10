'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';

/**
 * Hook для управления состоянием формы с ошибками и сообщениями
 */
export function useFormState() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  }, []);

  const setSubmitting = useCallback((value: boolean) => {
    setIsLoading(value);
  }, []);

  const setFormError = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  const setFormSuccess = useCallback((message: string) => {
    setSuccess(message);
    setError(null);
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    isLoading,
    error,
    success,
    fieldErrors,
    setSubmitting,
    setFormError,
    setFormSuccess,
    setFieldError,
    clearFieldError,
    reset,
  };
}

/**
 * Hook для обработки Zod ошибок и преобразования их в формат формы
 */
export function useZodErrors() {
  const handleZodError = useCallback(
    (error: z.ZodError) => {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });
      return fieldErrors;
    },
    [],
  );

  return { handleZodError };
}

/**
 * Комбинированный hook для работы с формами, включая API вызовы
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAsyncForm<T extends Record<string, string | number | boolean>>() {
  const formState = useFormState();
  const { handleZodError } = useZodErrors();

  const handleSubmit = useCallback(
    async (
      schema: z.ZodSchema,
      data: T,
      onSuccess: (data: T) => Promise<void> | void,
    ) => {
      try {
        formState.reset();
        formState.setSubmitting(true);

        // Валидируем данные
        const validatedData = await schema.parseAsync(data);

        // Выполняем callback (обычно API вызов)
        await onSuccess(validatedData);
        formState.setFormSuccess('Операция выполнена успешно');
      } catch (error) {
        if (error instanceof z.ZodError) {
          handleZodError(error);
          formState.setFieldError('form', 'Проверьте ошибки валидации');
        } else if (error instanceof Error) {
          formState.setFormError(error.message);
        } else {
          formState.setFormError('Произошла неожиданная ошибка');
        }
      } finally {
        formState.setSubmitting(false);
      }
    },
    [formState, handleZodError],
  );

  return {
    ...formState,
    handleSubmit,
  };
}

