'use client';

import * as React from 'react';
import type { FieldValues, UseFormRegister, Path, FieldError } from 'react-hook-form';
import {
  Field,
  FieldDescription,
  FieldError as FieldErrorComponent,
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
  name: Path<T>;
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
}

interface TextFormFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  type: 'text' | 'email' | 'password' | 'number';
  register: UseFormRegister<T>;
  placeholder?: string;
}

interface SelectFormFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  type: 'select';
  value?: string;
  onValueChange?: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

interface CheckboxFormFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  type: 'checkbox';
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type AnyFormFieldProps<T extends FieldValues> =
  | TextFormFieldProps<T>
  | SelectFormFieldProps<T>
  | CheckboxFormFieldProps<T>;

function FormField<T extends FieldValues>(props: AnyFormFieldProps<T>) {
  const { name, label, description, error, required } = props;

  const fieldId = `field-${String(name)}`;

  return (
    <Field>
      {label && (
        <FieldLabel htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </FieldLabel>
      )}

      {props.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={fieldId}
            checked={props.checked}
            onCheckedChange={props.onCheckedChange}
            aria-invalid={!!error}
          />
          {label && <Label htmlFor={fieldId}>{label}</Label>}
        </div>
      ) : props.type === 'select' ? (
        <Select value={props.value} onValueChange={props.onValueChange}>
          <SelectTrigger id={fieldId} aria-invalid={!!error}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={fieldId}
          type={props.type}
          placeholder={props.placeholder}
          aria-invalid={!!error}
          {...props.register(name)}
        />
      )}

      {description && <FieldDescription>{description}</FieldDescription>}
      {error?.message && <FieldErrorComponent>{error.message}</FieldErrorComponent>}
    </Field>
  );
}

export {
  FormField,
  Field,
  FieldDescription,
  FieldErrorComponent as FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Label,
};
