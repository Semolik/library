'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { getFormFieldsFromSchema } from '@workspace/contracts/auth';
import type { FormFieldConfig } from '@/lib/form-types';

/**
 * Hook для генерации конфигурации полей формы из Zod-схемы
 * Использует общую схему из contracts как single source of truth
 */
export function useFormFieldsFromSchema(
  schema: z.ZodObject<any>,
): FormFieldConfig[] {
  return useMemo(() => {
    return getFormFieldsFromSchema(schema);
  }, [schema]);
}
