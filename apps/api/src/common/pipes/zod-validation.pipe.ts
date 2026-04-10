import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  async transform(value: unknown) {
    try {
      return await this.schema.parseAsync(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.reduce(
          (acc, err) => {
            const path = err.path.join('.');
            acc[path] = err.message;
            return acc;
          },
          {} as Record<string, string>,
        );

        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      }
      throw error;
    }
  }
}

