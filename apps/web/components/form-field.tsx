'use client';

import React from 'react';
import {
  Controller,
  FieldValues,
  Path,
  UseFormReturn,
} from 'react-hook-form';
import { FormFieldConfig } from '@/lib/form-types';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '@workspace/ui/components/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  field: FormFieldConfig;
  isLoading?: boolean;
}

/**
 * Компонент поля формы с интеграцией shadcn/ui
 */
export function FormField<T extends FieldValues>({
  form,
  field,
  isLoading = false,
}: FormFieldProps<T>) {
  const { control } = form;
  const fieldName = field.name as Path<T>;

  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field: fieldProps }: { field: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ }) => (
        <Field>
          <FieldLabel htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </FieldLabel>

          {field.type === 'textarea' ? (
            <InputGroup>
              <InputGroupTextarea
                {...fieldProps}
                id={field.name}
                placeholder={field.placeholder}
                disabled={isLoading || field.disabled}
                rows={field.className?.includes('rows-') ? 6 : 4}
                className="min-h-24 resize-none"
              />
              {field.className?.includes('character-count') && (
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {(fieldProps.value || '').length}/100 characters
                  </InputGroupText>
                </InputGroupAddon>
              )}
            </InputGroup>
          ) : field.type === 'select' ? (
            <Select
              value={fieldProps.value || ''}
              onValueChange={fieldProps.onChange}
              disabled={isLoading || field.disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Выберите...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <Checkbox
                {...fieldProps}
                id={field.name}
                disabled={isLoading || field.disabled}
                checked={!!fieldProps.value}
                onCheckedChange={fieldProps.onChange}
              />
              <Label
                htmlFor={field.name}
                className="font-normal cursor-pointer"
              >
                {field.label}
              </Label>
            </div>
          ) : (
            <Input
              {...fieldProps}
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              disabled={isLoading || field.disabled}
            />
          )}

          {field.helpText && (
            <FieldDescription>{field.helpText}</FieldDescription>
          )}
        </Field>
      )}
    />
  );
}

