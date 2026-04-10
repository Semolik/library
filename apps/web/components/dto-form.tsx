'use client';

import React from 'react';
import {
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from './form-field';
import { FormFieldConfig, FormConfig } from '@/lib/form-types';
import { Field } from '@workspace/ui/components/field';
import { Button } from '@workspace/ui/components/button';

interface DtoFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  fields: FormFieldConfig[];
  config?: Omit<FormConfig, 'fields'>;
  onSubmit: (data: T) => void | Promise<void>;
  isLoading?: boolean;
  success?: string | null;
  showCard?: boolean;
}

/**
 * Компонент формы для работы с DTO
 * Интегрирован с shadcn/ui компонентами и sonner уведомлениями
 */
export function DtoForm<T extends FieldValues>({
  form,
  fields,
  config,
  onSubmit,
  isLoading = false,
  success,
  showCard = true,
}: DtoFormProps<T>) {
  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    if (success) {
      toast.success(success);
    }
  });

  const formContent = (
    <form onSubmit={handleSubmit} className={config?.className || 'space-y-6'}>
      {config?.title && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
          {config?.description && (
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {fields.map(field => (
          <FormField
            key={field.name}
            form={form}
            field={field}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isLoading}
        >
          Очистить
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading
            ? config?.submitLoadingText || 'Загрузка...'
            : config?.submitText || 'Отправить'}
        </Button>
      </div>
    </form>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Field className="rounded-2xl border bg-card p-6 shadow-sm">
      {formContent}
    </Field>
  );
}
