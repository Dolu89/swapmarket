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
  public satoshis_to_pay: number

  @column()
  public invoice_to_pay: string

  @column()
  public vout_index: number

  @column()
  public is_paid: boolean
}
