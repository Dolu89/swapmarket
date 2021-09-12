import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Swap extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public swap_address: string

  @column()
  public script_hex: string

  @column()
  public invoice_to_pay: string

  @column()
  public satoshis_to_pay: number

  @column()
  public contract_vout_index: number

  @column()
  public invoice_pre_image: string

  @column()
  public contract_tx_claimed: string
}
