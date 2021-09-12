import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Swaps extends BaseSchema {
  protected tableName = 'swaps'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.string('swap_address')
      table.string('script_hex')
      table.string('invoice_to_pay')
      table.integer('satoshis_to_pay')

      table.integer('vout_index')
      table.boolean('is_paid').defaultTo(false)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
