import z from 'zod';

const envSchema = z.object({
    DATABASE_URL: z
        .string()
        .startsWith('postgresql://', 'URL do Postgres não está definida'),

    FRONTEND_URL: z.string().default('http://localhost:3000'),

    HTTP_PORT: z.coerce.number().default(3131),

    JWT_SECRET: z.string(),

    NODE_ENV: z.string().default('development'),


});

export const environment = envSchema.parse(process.env);
