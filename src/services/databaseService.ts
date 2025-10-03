import db from "../postgres/knex.js";
import { TariffMain, TariffDetail, ApiResponse } from "../types/index.js";

export class DatabaseService {
    async saveFullTariffData(
        apiData: ApiResponse,
        date: Date = new Date(),
    ): Promise<{
        mainTariffSaved: boolean;
        detailsResult: { created: number; updated: number };
        totalWarehouses: number;
    }> {
        const dateString = this.formatDate(date);
        const { dtNextBox, dtTillMax, warehouseList } = apiData.response.data;

        console.log(`💾 Сохранение полных данных тарифов за ${dateString}...`);
        console.log(`📅 dtNextBox: "${dtNextBox}", dtTillMax: "${dtTillMax}"`);

        const validatedNextBox = this.validateDate(dtNextBox);
        const validatedTillMax = this.validateDate(dtTillMax);

        if (!validatedNextBox || !validatedTillMax) {
            console.warn(`⚠️  Обнаружены пустые даты: dtNextBox="${dtNextBox}", dtTillMax="${dtTillMax}"`);
        }

        const trx = await db.transaction();

        try {
            // 1. Сохраняем основные данные тарифов
            let mainTariffSaved = false;
            const mainTariff: TariffMain = {
                date: dateString,
                dt_next_box: validatedNextBox,
                dt_till_max: validatedTillMax,
            };

            const exists = await trx("tariffs").where({ date: dateString }).first();

            if (exists) {
                await trx("tariffs")
                    .where({ date: dateString })
                    .update({
                        ...mainTariff,
                    });
                console.log(`✅ Обновлены основные тарифы за ${dateString}`);
            } else {
                await trx("tariffs").insert(mainTariff);
                console.log(`✅ Добавлены основные тарифы за ${dateString}`);
            }
            mainTariffSaved = true;

            // 2. Сохраняем детальные данные по складам
            let createdCount = 0;
            let updatedCount = 0;

            for (const warehouse of warehouseList) {
                const tariffDetail: TariffDetail = {
                    date: dateString,
                    warehouse_name: warehouse.warehouseName,
                    geo_name: warehouse.geoName,
                    box_delivery_base: this.parseNumber(warehouse.boxDeliveryBase),
                    box_delivery_coef_expr: this.parseNumber(warehouse.boxDeliveryCoefExpr),
                    box_delivery_liter: this.parseNumber(warehouse.boxDeliveryLiter),
                    box_delivery_marketplace_base: this.parseNumber(warehouse.boxDeliveryMarketplaceBase),
                    box_delivery_marketplace_coef_expr: this.parseNumber(warehouse.boxDeliveryMarketplaceCoefExpr),
                    box_delivery_marketplace_liter: this.parseNumber(warehouse.boxDeliveryMarketplaceLiter),
                    box_storage_base: this.parseNumber(warehouse.boxStorageBase),
                    box_storage_coef_expr: this.parseNumber(warehouse.boxStorageCoefExpr),
                    box_storage_liter: this.parseNumber(warehouse.boxStorageLiter),
                };

                const exists = await trx("tariffs_details")
                    .where({
                        date: dateString,
                        warehouse_name: warehouse.warehouseName,
                    })
                    .first();

                if (exists) {
                    await trx("tariffs_details")
                        .where({
                            date: dateString,
                            warehouse_name: warehouse.warehouseName,
                        })
                        .update({
                            ...tariffDetail,
                        });
                    updatedCount++;
                } else {
                    await trx("tariffs_details").insert(tariffDetail);
                    createdCount++;
                }
            }

            await trx.commit();

            console.log(
                `✅ Полные данные сохранены! Основные: ${mainTariffSaved ? "OK" : "FAIL"}, Детальные: создано ${createdCount}, обновлено ${updatedCount}`,
            );

            return {
                mainTariffSaved,
                detailsResult: { created: createdCount, updated: updatedCount },
                totalWarehouses: warehouseList.length,
            };
        } catch (error) {
            await trx.rollback();
            console.error("❌ Ошибка при сохранении полных данных тарифов:", error);

            // Детальный лог ошибки
            if (error instanceof Error) {
                console.error("💡 Детали ошибки:", error.message);
            }

            throw error;
        }
    }

    async getFullDataForGoogleSheetsWithSorting(
        date: Date = new Date(),
        sortBy: "storage" | "delivery" | "delivery_marketplace" = "storage",
    ): Promise<Array<TariffDetail & TariffMain>> {
        const dateString = this.formatDate(date);

        // Определяем поле для сортировки
        let sortField: string;
        switch (sortBy) {
            case "delivery":
                sortField = "box_delivery_coef_expr";
                break;
            case "delivery_marketplace":
                sortField = "box_delivery_marketplace_coef_expr";
                break;
            case "storage":
            default:
                sortField = "box_storage_coef_expr";
                break;
        }

        console.log(`📊 Получение данных для Google Sheets (сортировка по ${sortField}) за ${dateString}...`);

        try {
            const data = await db("tariffs_details as td")
                .join("tariffs as t", "td.date", "t.date")
                .where("td.date", dateString)
                .select("td.*", "t.dt_next_box", "t.dt_till_max")
                .orderBy(sortField, "asc"); // СОРТИРОВКА ПО ВЫБРАННОМУ КОЭФФИЦИЕНТУ

            if (!data || data.length === 0) {
                console.log(`📭 Нет данных за ${dateString}`);
                return [];
            }

            console.log(`✅ Получено ${data.length} записей (сортировка по ${sortField})`);

            // Логируем диапазон значений для отладки
            const sortedValues = data.map((item) => item[sortField]).sort((a, b) => a - b);
            console.log(`📈 Диапазон ${sortField}: ${sortedValues[0]} - ${sortedValues[sortedValues.length - 1]}`);

            return data;
        } catch (error) {
            console.error("❌ Ошибка при получении данных с сортировкой:", error);
            throw error;
        }
    }

    async getFullDataForGoogleSheets(date: Date = new Date()): Promise<Array<TariffDetail & TariffMain>> {
        const dateString = this.formatDate(date);

        console.log(`📊 Получение данных для Google Sheets за ${dateString}...`);

        try {
            // Выполняем JOIN запрос чтобы получить данные из обеих таблиц
            const data = await db("tariffs_details as td")
                .join("tariffs as t", "td.date", "t.date")
                .where("td.date", dateString)
                .select(
                    // Поля из tariffs_details
                    "td.date",
                    "td.warehouse_name",
                    "td.geo_name",
                    "td.box_delivery_base",
                    "td.box_delivery_coef_expr", // ← этот коэффициент для сортировки
                    "td.box_delivery_liter",
                    "td.box_delivery_marketplace_base",
                    "td.box_delivery_marketplace_coef_expr", // ← этот коэффициент для сортировки
                    "td.box_delivery_marketplace_liter",
                    "td.box_storage_base",
                    "td.box_storage_coef_expr", // ← этот коэффициент для сортировки
                    "td.box_storage_liter",
                    // Поля из tariffs
                    "t.dt_next_box",
                    "t.dt_till_max",
                )
                .orderBy("td.box_storage_coef_expr", "asc"); // СОРТИРОВКА ПО ВОЗРАСТАНИЮ

            if (!data || data.length === 0) {
                console.log(`📭 Нет данных за ${dateString} для Google Sheets`);
                return [];
            }

            console.log(`✅ Получено ${data.length} записей для Google Sheets`);
            console.log(`📈 Диапазон коэффициентов: ${data[0].box_storage_coef_expr} - ${data[data.length - 1].box_storage_coef_expr}`);

            return data;
        } catch (error) {
            console.error("❌ Ошибка при получении данных для Google Sheets:", error);
            throw error;
        }
    }

    /** Валидирует дату - возвращает null для пустых строк */
    private validateDate(dateString: string | null): string | null {
        if (!dateString || dateString.trim() === "" || dateString === "null" || dateString === "undefined") {
            return null;
        }

        // Проверяем, что строка соответствует формату даты
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            console.warn(`⚠️  Неверный формат даты: "${dateString}"`);
            return null;
        }

        return dateString;
    }

    private parseNumber(value: string): number {
        if (!value) return 0;
        return parseFloat(value.replace(",", "."));
    }

    private formatDate(date: Date): string {
        return date.toISOString().split("T")[0];
    }
}
