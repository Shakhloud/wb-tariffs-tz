import axios from "axios";
import env from "../config/env/env.js";

export class ApiService {
    //todo: НАДО ТОКЕН И АПИ УРЛ В ПЕРЕМЕННУЮ СРЕДЫ ВНЕСТИ И ПОЛУЧАТЬ ИХ ОТТУДА
    private readonly token = env.WB_API_TOKEN;
    private readonly apiUrl = env.WB_API_URL;

    private axiosInstance;

    constructor() {
        this.axiosInstance = this.createAxiosInstance();
    }

    createAxiosInstance() {
        return axios.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers: {
                "User-Agent": "WB-Tariffs-Service/1.0",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": this.token,
            },
        });
    }

    async fetchTariffs(date: Date) {
        console.log("Fetching tariffs from API...");

        const response = await this.axiosInstance.get("", {
            params: this.prepareRequestParams(date),
        });

        console.log("Response status:", response.status);

        return response.data;
    }

    prepareRequestParams(date: Date) {
        return {
            date: this.formatDate(date),
        };
    }

    formatDate(date = new Date()) {
        return date.toISOString().split("T")[0];
    }
}
