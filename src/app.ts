import knex, { migrate, seed } from "#postgres/knex.js";
import { SchedulerService } from "#services/schedulerService.js";

class Application {
    private schedulerService: SchedulerService;

    constructor() {
        this.schedulerService = new SchedulerService();
    }

    /** Запускает приложение */
    async start(): Promise<void> {
        try {
            console.log("🚀 Запуск WB Tariffs Service...");
            console.log(`📍 Окружение: ${process.env.NODE_ENV || "development"}`);
            console.log(`🕐 Время запуска: ${new Date().toISOString()}`);

            // 1. Запускаем миграции и сиды
            await this.runDatabaseMigrations();

            // 2. Запускаем планировщик
            await this.startScheduler();

            console.log("✅ Приложение успешно запущено!");
            console.log("⏰ Планировщик работает в фоновом режиме");
        } catch (error) {
            console.error("❌ Ошибка при запуске приложения:", error);
            process.exit(1);
        }
    }

    /** Выполняет миграции и сиды базы данных */
    private async runDatabaseMigrations(): Promise<void> {
        try {
            console.log("\n🗄️  Запуск миграций базы данных...");

            await migrate.latest();
            console.log("✅ Миграции выполнены успешно");

            console.log("\n🌱 Запуск сидов базы данных...");
            await seed.run();
            console.log("✅ Сиды выполнены успешно");

            console.log("📊 База данных готова к работе");
        } catch (error) {
            console.error("❌ Ошибка при выполнении миграций/сидов:", error);
            throw error;
        }
    }

    /** Запускает планировщик */
    private async startScheduler(): Promise<void> {
        try {
            console.log("\n⏰ Запуск планировщика...");

            this.schedulerService.start();

            console.log("✅ Планировщик запущен");
        } catch (error) {
            console.error("❌ Ошибка при запуске планировщика:", error);
            throw error;
        }
    }

    /** Останавливает приложение */
    async stop(): Promise<void> {
        console.log("🛑 Ручная остановка приложения...");

        // Останавливаем планировщик
        this.schedulerService.stop();

        // Закрываем соединение с БД
        await knex.destroy();

        console.log("✅ Приложение остановлено");
    }
}

// Создаем и запускаем приложение
const app = new Application();

// Запуск приложения
app.start().catch((error) => {
    console.error("💥 Критическая ошибка при запуске:", error);
    process.exit(1);
});

// Экспортируем для тестирования
export default Application;
