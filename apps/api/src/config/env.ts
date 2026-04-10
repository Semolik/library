import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Database
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('library'),
  // JWT (HS256)
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type EnvSchema = z.infer<typeof envSchema>;

