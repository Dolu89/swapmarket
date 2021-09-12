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

      // Initial data received from a new swap
      table.string('swap_address')
      table.string('script_hex')
      table.string('invoice_to_pay')
      table.integer('satoshis_to_pay')

      /**
       * Error in case claim has not succeeded
       */
      table.string('error')

      /**
       * Step 1 : Customer has paid the contract address
       * contract_vout_index : vout index of the paid contract address.
       *                       If defined, contract has been paid by the customer
       */
      table.integer('contract_vout_index')

      /**
       * Step 2 : Provider pay the provided Lightning invoice
       * invoice_pre_image : Invoice pre image used to claim the reward
       *                     If defined, invoice has been paid by the provider
       */
      table.string('invoice_pre_image')

      /**
       * Step 3 : Claim the reward from the contact address
       * contract_tx_claimed : Tx hex string used to claim satoshis from contact address
       */
      table.string('contract_tx_claimed')

      /**
       * Step 4 : Once tx is claimed, swap is finalized
       * contract_finalized : Is the swap finalized?
       */
      table.boolean('contract_finalized').defaultTo(false)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
