import { z } from 'zod';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';

export interface FormFieldConfigFromSchema {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  type: FormFieldType;
  required: boolean;
}

export interface SwaggerFieldMeta {
  example?: string | number;
  format?: string;
}

export interface FieldMetaFromSchema {
  label: string;
  placeholder?: string;
  helpText?: string;
  type: FormFieldType;
  required: boolean;
  swagger: SwaggerFieldMeta;
}

function readDescription(fieldName: string, field: z.ZodTypeAny) {
  return field.description ?? fieldName;
}

export function getFieldMetaFromSchema(fieldName: string, field: z.ZodTypeAny): FieldMetaFromSchema {
  const description = readDescription(fieldName, field);
  const lower = `${fieldName} ${description}`.toLowerCase();

  const type: FormFieldType = lower.includes('password') || lower.includes('secret') || lower.includes('token') || lower.includes('refresh')
    ? 'password'
    : lower.includes('email')
      ? 'email'
      : 'text';

  const swagger: SwaggerFieldMeta = {};
  const placeholder =
    type === 'email'
      ? 'you@example.com'
      : type === 'password'
        ? '••••••••'
        : undefined;

  if (lower.includes('email')) swagger.example = 'user@example.com';
  if (lower.includes('password')) swagger.example = 'securePassword123';
  if (lower.includes('refresh') || lower.includes('token')) swagger.example = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  if (lower.includes('id')) swagger.example = 1;
  if (lower.includes('expires')) swagger.example = 3600;

  return {
    label: description,
    placeholder,
    helpText: undefined,
    type,
    required: !field.isOptional(),
    swagger,
  };
}

export function getFormFieldsFromSchema<S extends z.ZodRawShape>(
  schema: z.ZodObject<S>,
): FormFieldConfigFromSchema[] {
  const shape = schema.shape as Record<string, z.ZodTypeAny>;

  return Object.entries(shape).map(([name, field]) => {
    const meta = getFieldMetaFromSchema(name, field);

    return {
      name,
      label: meta.label,
      placeholder: meta.placeholder,
      helpText: meta.helpText,
      type: meta.type,
      required: meta.required,
    };
  });
}
