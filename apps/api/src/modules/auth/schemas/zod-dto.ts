import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { getFieldMetaFromSchema } from '@workspace/contracts/auth';

type ZodSchemaShape = Record<string, z.ZodTypeAny>;

type DecoratorTarget<T> = abstract new () => T;

function isZodObject(field: z.ZodTypeAny): field is z.ZodObject<Record<string, z.ZodTypeAny>> {
  return field instanceof z.ZodObject;
}

function getZodBaseType(field: z.ZodTypeAny): z.ZodTypeAny {
  if (field instanceof z.ZodOptional) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getZodBaseType((field._def as any).schema);
  }
  if (field instanceof z.ZodNullable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getZodBaseType((field._def as any).schema);
  }
  return field;
}

export function createSwaggerDtoFromZod<S extends ZodSchemaShape>(
  schema: z.ZodObject<S>,
  className: string,
) {
  const fields = Object.entries(schema.shape) as Array<[string, z.ZodTypeAny]>;

  class GeneratedDto {}

  Object.defineProperty(GeneratedDto, 'name', { value: className });

  for (const [fieldName, field] of fields) {
    const baseField = getZodBaseType(field);

    // Skip nested ZodObject fields to avoid circular dependencies
    if (isZodObject(baseField)) {
      ApiProperty({
        description: baseField.description || fieldName,
        type: () => Object,
        required: !field.isOptional(),
      })(GeneratedDto.prototype, fieldName);
      continue;
    }

    const meta = getFieldMetaFromSchema(fieldName, field);

    ApiProperty({
      example: meta.swagger.example,
      description: meta.label,
      required: meta.required,
    })(GeneratedDto.prototype, fieldName);
  }

  return GeneratedDto as unknown as DecoratorTarget<z.infer<typeof schema>>;
}
