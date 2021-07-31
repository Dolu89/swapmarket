import { Socket } from 'socket.io'

export interface ProviderKeyValue {
  socket: Socket
  data: ProviderKeyValueData
}

export interface ProviderKeyValueData extends ProviderKeyValueDataSanitazed {
  secret: string
}

export interface ProviderKeyValueSanitazed {
  socket: Socket
  data: ProviderKeyValueDataSanitazed
}

export interface ProviderKeyValueDataSanitazed {
  name: string
  hash: string
  publicKey: string
  fees: number
}
