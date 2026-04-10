/**
 * Типы для работы с формами
 */

export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  helpText?: string;
  className?: string;
}

export interface FormConfig {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  submitText?: string;
  submitLoadingText?: string;
  className?: string;
}

