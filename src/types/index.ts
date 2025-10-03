export interface ApiResponse {
    response: {
        data: {
            dtNextBox: string | null;
            dtTillMax: string | null;
            warehouseList: WarehouseTariff[];
        };
    };
}

export interface WarehouseTariff {
    boxDeliveryBase: string;
    boxDeliveryCoefExpr: string;
    boxDeliveryLiter: string;
    boxDeliveryMarketplaceBase: string;
    boxDeliveryMarketplaceCoefExpr: string;
    boxDeliveryMarketplaceLiter: string;
    boxStorageBase: string;
    boxStorageCoefExpr: string;
    boxStorageLiter: string;
    geoName: string;
    warehouseName: string;
}

export interface TariffMain {
    date: string;
    dt_next_box: string | null;
    dt_till_max: string | null;
}

export interface TariffDetail {
    date: string;
    warehouse_name: string;
    box_delivery_base: number;
    box_delivery_coef_expr: number;
    box_delivery_liter: number;
    box_delivery_marketplace_base: number;
    box_delivery_marketplace_coef_expr: number;
    box_delivery_marketplace_liter: number;
    box_storage_base: number;
    box_storage_coef_expr: number;
    box_storage_liter: number;
    geo_name: string;
}
