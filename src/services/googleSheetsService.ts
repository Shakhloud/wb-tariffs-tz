import { google, sheets_v4 } from "googleapis";
import { DatabaseService } from "./databaseService.js";
import env from "#config/env/env.js";

export class GoogleSheetsService {
    private sheets: sheets_v4.Sheets;
    private databaseService: DatabaseService;

    constructor() {
        this.databaseService = new DatabaseService();
        this.sheets = this.initializeSheets();
    }

    private initializeSheets(): sheets_v4.Sheets {
        try {
            const auth = new google.auth.JWT({
                email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: env.GOOGLE_PRIVATE_KEY,
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            return google.sheets({ version: "v4", auth });
        } catch (error) {
            console.error("❌ Ошибка инициализации Google Sheets API:", error);
            throw error;
        }
    }

    async updateSheet(sheetId: string, tariffsData: any[]): Promise<void> {
        console.log(`📝 Обновление таблицы ${sheetId}...`);

        try {
            // Получаем отсортированные данные
            const sortedData = await this.databaseService.getFullDataForGoogleSheetsWithSorting(
                new Date(),
                "storage", // сортировка по box_storage_coef_expr
            );

            if (!sortedData || sortedData.length === 0) {
                console.log(`📭 Нет отсортированных данных для обновления таблицы ${sheetId}`);
                return;
            }

            // Получаем информацию о всех листах в таблице
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: sheetId,
            });

            const sheets = spreadsheet.data.sheets || [];

            // Ищем лист с данными (предполагаем, что он называется "Data" или аналогично)
            // Если у вас другое название листа, замените здесь
            const dataSheetName = "stocks_coefs";
            const targetSheet = sheets.find((sheet) => sheet.properties?.title === dataSheetName);

            // Если лист не существует - создаем его
            if (!targetSheet) {
                console.log(`📄 Лист "${dataSheetName}" не найден, создаем новый...`);

                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: sheetId,
                    requestBody: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: dataSheetName,
                                        gridProperties: {
                                            rowCount: 1000,
                                            columnCount: 20,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                });

                console.log(`✅ Лист "${dataSheetName}" успешно создан`);
            }

            // Подготавливаем данные для записи
            const headers = Object.keys(sortedData[0]);
            const rows = sortedData.map((item) => Object.values(item));
            const values = [headers, ...rows];

            // Обновляем лист данными
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `${dataSheetName}!A1`,
                valueInputOption: "RAW",
                requestBody: {
                    values: values,
                },
            });

            console.log(`✅ Таблица ${sheetId} успешно обновлена ${sortedData.length} записями (отсортировано по box_storage_coef_expr)`);
        } catch (error) {
            console.error(`❌ Ошибка при обновлении таблицы ${sheetId}:`, error);
            throw error;
        }
    }

    /** Очищает лист stocks_coefs в указанной таблице */
    private async clearSheet(sheetId: string): Promise<void> {
        try {
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: sheetId,
                range: "stocks_coefs",
            });
        } catch (error) {
            console.error(`❌ Ошибка при очистке листа stocks_coefs:`, error);
            throw error;
        }
    }
}
