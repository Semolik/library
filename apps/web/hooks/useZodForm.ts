import { z } from 'zod';
import { useCallback } from 'react';

/**
 * Hook для работы с Zod валидацией
 */
export function useZodForm<T extends z.ZodType>(schema: T) {
  const validate = useCallback(
    async (data: unknown) => {
      try {
        const result = await schema.parseAsync(data);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach(err => {
            const path = err.path.join('.');
            fieldErrors[path] = err.message;
          });
          return { success: false, errors: fieldErrors };
        }
        return { success: false, errors: { form: 'Ошибка валидации' } };
      }
    },
    [schema],
  );

  const validateField = useCallback(
    async (fieldName: string, value: unknown) => {
      try {
        const shape = (schema as unknown as z.ZodObject<any>).shape;
        if (!shape || !shape[fieldName]) return { success: true };

        await shape[fieldName].parseAsync(value);
        return { success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, error: error.errors[0]?.message };
        }
        return { success: false, error: 'Ошибка валидации' };
      }
    },
    [schema],
  );

  return { validate, validateField };
}

