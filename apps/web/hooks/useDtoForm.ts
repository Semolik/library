'use client';

import { FieldValues, useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Hook для работы с формами через react-hook-form и Zod
 * Интегрирует валидацию и управление состоянием формы
 */
export function useDtoForm<
  T extends z.ZodSchema,
  TFieldValues extends FieldValues = z.infer<T>,
>(
  schema: T,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
) {
  return useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
    mode: options?.mode || 'onBlur',
  });
}

