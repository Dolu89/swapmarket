import { Socket } from 'socket.io'

export interface ProviderKeyValue {
  socket: Socket
  data: ProviderKeyValueData
}

export interface ProviderKeyValueData extends ProviderKeyValueDataSanitized {
  secret: string
}

export interface ProviderKeyValueSanitized {
  socket: Socket
  data: ProviderKeyValueDataSanitized
}

export interface ProviderKeyValueDataSanitized {
  name: string
  hash: string
  publicKey: string
  fees: number
}
