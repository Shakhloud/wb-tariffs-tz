/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */

export async function up(knex) {
    return knex.schema.createTable("tariffs", (table) => {
        table.date("date").primary();
        table.date("dt_next_box");
        table.date("dt_till_max");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs");
}
