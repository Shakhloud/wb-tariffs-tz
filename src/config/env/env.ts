import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]).default("development"),

    // Database - используем DB_ префикс для консистентности
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .default("5432")
        .transform((value) => parseInt(value)),
    DB_NAME: z.string().default("postgres"),
    DB_USER: z.string().default("postgres"),
    DB_PASSWORD: z.string().default("postgres"),

    // App
    APP_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .default("3000")
        .transform((value) => parseInt(value)),

    // Wildberries API
    WB_API_TOKEN: z.string(),
    WB_API_URL: z.string().default("https://common-api.wildberries.ru/api/v1/tariffs/box"),
    SCHEDULER_CRON: z.string().default("0 * * * * *"),

    // Google Sheets
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string(),
    GOOGLE_PRIVATE_KEY: z.string().transform((value) => value.replace(/\\n/g, "\n")),
    GOOGLE_SHEET_IDS: z.string().transform((value) => value.split(",")),
});

const env = envSchema.parse({
    // Database
    DB_HOST: process.env.DB_HOST || process.env.POSTGRES_HOST, // Поддержка обоих вариантов
    DB_PORT: process.env.DB_PORT || process.env.POSTGRES_PORT,
    DB_NAME: process.env.DB_NAME || process.env.POSTGRES_DB,
    DB_USER: process.env.DB_USER || process.env.POSTGRES_USER,
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,

    // App
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT || process.env.PORT,

    // Wildberries
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    WB_API_URL: process.env.WB_API_URL,
    SCHEDULER_CRON: process.env.SCHEDULER_CRON,

    // Google
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_IDS: process.env.GOOGLE_SHEET_IDS,
});

export default env;

// Экспорт для удобства
export const config = {
    db: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
    },
    app: {
        port: env.APP_PORT,
        env: env.NODE_ENV,
    },
    wildberries: {
        token: env.WB_API_TOKEN,
        url: env.WB_API_URL,
        schedulerCron: env.SCHEDULER_CRON,
    },
    google: {
        serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: env.GOOGLE_PRIVATE_KEY,
        sheetIds: env.GOOGLE_SHEET_IDS,
    },
};
