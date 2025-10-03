/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tariffs_details", (table) => {
        table.date("date").notNullable();
        table.string("warehouse_name").notNullable();

        table.decimal("box_delivery_base", 10, 2);
        table.decimal("box_delivery_coef_expr", 10, 2);
        table.decimal("box_delivery_liter", 10, 2);
        table.decimal("box_delivery_marketplace_base", 10, 2);
        table.decimal("box_delivery_marketplace_coef_expr", 10, 2);
        table.decimal("box_delivery_marketplace_liter", 10, 2);
        table.decimal("box_storage_base", 10, 2);
        table.decimal("box_storage_coef_expr", 10, 2);
        table.decimal("box_storage_liter", 10, 2);
        table.string("geo_name");

        table.primary(["date", "warehouse_name"]);

        table.foreign("date").references("date").inTable("tariffs").onDelete("CASCADE").onUpdate("CASCADE");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs_details");
}
