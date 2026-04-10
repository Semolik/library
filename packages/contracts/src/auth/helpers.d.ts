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
export declare function getFormFieldsFromSchema<S extends z.ZodRawShape>(schema: z.ZodObject<S>): FormFieldConfigFromSchema[];
//# sourceMappingURL=helpers.d.ts.map