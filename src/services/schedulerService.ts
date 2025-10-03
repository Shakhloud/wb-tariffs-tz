import { CronJob } from "cron";
import { ApiService } from "../services/apiService.js";
import { DatabaseService } from "../services/databaseService.js";
import { GoogleSheetsService } from "./googleSheetsService.js";
import env from "../config/env/env.js";

export class SchedulerService {
    private apiService: ApiService;
    private databaseService: DatabaseService;
    private googleSheetsService: GoogleSheetsService;
    private isRunning: boolean = false;
    private lastUpdateTime: Date | null = null;

    constructor() {
        this.apiService = new ApiService();
        this.databaseService = new DatabaseService();
        this.googleSheetsService = new GoogleSheetsService();
    }

    /** Запускает планировщик для регулярного обновления данных */
    start(): void {
        console.log("🚀 Запуск планировщика обновления Google таблиц...");

        // Проверяем конфигурацию перед запуском
        this.validateConfiguration();

        // Запускаем немедленно при старте
        this.executeFullUpdate().catch((error) => {
            console.error("❌ Ошибка при первоначальном обновлении:", error);
        });

        // Настраиваем регулярное выполнение каждую минуту
        const cronExpression = String(env.SCHEDULER_CRON);

        const job = new CronJob(cronExpression, async () => {
            await this.executeFullUpdate();
        });

        job.start();

        console.log("✅ Планировщик запущен. Обновление каждую минуту");
        console.log(`📅 Расписание: ${cronExpression}`);
        console.log(`📊 Количество Google таблиц: ${env.GOOGLE_SHEET_IDS.length}`);
    }

    /** Проверяет конфигурацию перед запуском */
    private validateConfiguration(): void {
        const sheetIds = env.GOOGLE_SHEET_IDS;

        if (!sheetIds || sheetIds.length === 0) {
            console.warn("⚠️  Внимание: Не указаны ID Google таблиц для обновления");
            console.log("💡 Добавьте GOOGLE_SHEET_IDS в .env файл");
        } else {
            console.log(`✅ Настроено ${sheetIds.length} Google таблиц для обновления`);
        }

        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
            console.warn("⚠️  Внимание: Не настроены учетные данные Google Service Account");
        } else {
            console.log("✅ Учетные данные Google Service Account настроены");
        }
    }

    /** Выполняет полный цикл обновления: API → БД → Google Sheets */
    async executeFullUpdate(): Promise<void> {
        if (this.isRunning) {
            console.log("⏳ Обновление уже выполняется, пропускаем...");
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            console.log("\n🔄 === ЗАПУСК ПОЛНОГО ОБНОВЛЕНИЯ ===");
            console.log(`🕐 Время запуска: ${new Date().toISOString()}`);

            // 1. Получаем данные из WB API
            console.log("📡 Шаг 1: Получение данных из WB API...");
            const apiData = await this.apiService.fetchTariffs(new Date());
            console.log(`✅ Получены данные для ${apiData.response.data.warehouseList.length} складов`);

            // 2. Сохраняем данные в БД
            console.log("💾 Шаг 2: Сохранение данных в базу данных...");
            const saveResult = await this.databaseService.saveFullTariffData(apiData);
            console.log(`✅ Данные сохранены в БД: ${saveResult.totalWarehouses} складов`);

            // 3. Обновляем Google таблицы
            console.log("📊 Шаг 3: Обновление Google таблиц...");
            await this.executeGoogleSheetsUpdate();

            this.lastUpdateTime = new Date();
            const executionTime = Date.now() - startTime;

            console.log(`✅ === ОБНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО ===`);
            console.log(`⏱️  Время выполнения: ${executionTime}ms`);
            console.log(`🕐 Последнее обновление: ${this.lastUpdateTime.toISOString()}`);
        } catch (error) {
            console.error("❌ === ОБНОВЛЕНИЕ ЗАВЕРШЕНО С ОШИБКАМИ ===");

            if (error instanceof Error) {
                console.error(`💡 Ошибка: ${error.message}`);
            }

            await this.handleUpdateError(error);
        } finally {
            this.isRunning = false;
        }
    }

    /** Выполняет обновление только Google таблиц (данные уже в БД) */
    async executeGoogleSheetsUpdate(): Promise<void> {
        const sheetIds = env.GOOGLE_SHEET_IDS;

        if (!sheetIds || sheetIds.length === 0) {
            console.log("📭 Нет Google таблиц для обновления");
            return;
        }

        console.log(`🔄 Начало обновления ${sheetIds.length} Google таблиц...`);

        try {
            // Получаем отсортированные данные из БД
            console.log("📥 Получение отсортированных данных из БД...");
            const tariffsData = await this.databaseService.getFullDataForGoogleSheets();

            if (!tariffsData || tariffsData.length === 0) {
                console.log("📭 Нет данных в БД для обновления таблиц");
                return;
            }

            console.log(`✅ Получено ${tariffsData.length} записей, отсортированных по коэффициенту`);

            // Обновляем все таблицы
            console.log(`📤 Отправка данных в ${sheetIds.length} Google таблиц...`);

            const updatePromises = sheetIds.map((sheetId, index) => this.updateSingleSheet(sheetId, tariffsData, index + 1));

            await Promise.all(updatePromises);

            console.log(`✅ Все ${sheetIds.length} Google таблиц успешно обновлены`);
        } catch (error) {
            console.error("❌ Ошибка при обновлении Google таблиц:", error);
            throw error;
        }
    }

    /** Обновляет одну Google таблицу */
    private async updateSingleSheet(sheetId: string, tariffsData: any[], sheetNumber: number): Promise<void> {
        try {
            console.log(`   ${sheetNumber}. Обновление таблицы: ${sheetId}...`);

            await this.googleSheetsService.updateSheet(sheetId, tariffsData);

            console.log(`   ✅ Таблица ${sheetNumber} обновлена`);
        } catch (error) {
            console.error(`   ❌ Ошибка при обновлении таблицы ${sheetId}:`, error);
            // Продолжаем обновление других таблиц даже при ошибке
            throw error;
        }
    }

    /** Обработка ошибок обновления */
    private async handleUpdateError(error: any): Promise<void> {
        console.error("🚨 Обработка ошибки обновления:");
        console.error("   💡 Тип:", typeof error);
        console.error("   💡 Сообщение:", error.message);
        console.error("   💡 Stack:", error.stack);

        // Для минутного интервала не делаем повторные попытки,
        // т.к. следующее обновление будет через минуту
        console.log("🔄 Следующая попытка через 1 минуту по расписанию");
    }

    /** Получает статус планировщика */
    getStatus(): {
        isRunning: boolean;
        lastUpdate: string | null;
        nextUpdate: string;
        configuredSheets: number;
        updateInterval: string;
    } {
        const now = new Date();
        const nextUpdate = new Date(now);
        nextUpdate.setMinutes(now.getMinutes() + 1); // Следующее обновление через 1 минуту

        return {
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdateTime?.toISOString() || null,
            nextUpdate: nextUpdate.toISOString(),
            configuredSheets: env.GOOGLE_SHEET_IDS.length,
            updateInterval: "1 минута",
        };
    }

    /** Получает статистику обновлений */
    getStats(): {
        totalUpdates: number;
        lastSuccess: string | null;
        averageTime: number | null;
    } {
        // Здесь можно добавить сбор статистики
        return {
            totalUpdates: 0, // TODO: реализовать подсчет
            lastSuccess: this.lastUpdateTime?.toISOString() || null,
            averageTime: null, // TODO: реализовать расчет
        };
    }

    /** Останавливает планировщик */
    stop(): void {
        console.log("🛑 Остановка планировщика...");
        this.isRunning = false;
    }
}
