import type { Knex } from "knex";
import { config } from "../env/env.js";

const knexConfig: { [key: string]: Knex.Config } = {
    development: {
        client: "postgresql", // ← ЭТО ОБЯЗАТЕЛЬНОЕ ПОЛЕ
        connection: {
            host: config.db.host,
            port: config.db.port,
            database: config.db.database,
            user: config.db.user,
            password: config.db.password,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: "./src/postgres/migrations",
            tableName: "knex_migrations",
        },
        seeds: {
            directory: "./src/postgres/seeds",
        },
    },

    production: {
        client: "postgresql", // ← ЭТО ОБЯЗАТЕЛЬНОЕ ПОЛЕ
        connection: {
            host: config.db.host,
            port: config.db.port,
            database: config.db.database,
            user: config.db.user,
            password: config.db.password,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: "./src/postgres/migrations",
            tableName: "knex_migrations",
        },
        seeds: {
            directory: "./src/postgres/seeds",
        },
    },
};

// Экспортируем по умолчанию конфиг для текущего окружения
export default knexConfig[config.app.env];
