import ProviderNotFoundException from 'App/Exceptions/ProviderNotFoundException'
import {
  ProviderKeyValueData,
  ProviderKeyValueDataSanitazed,
  ProviderKeyValueSanitazed,
} from 'App/Models/ProviderKeyValue'
import { Socket } from 'socket.io'

class ProviderService {
  private providers: { [key: string]: ProviderKeyValueSanitazed }

  constructor() {
    this.providers = {}
  }

  public getProviders(): ProviderKeyValueDataSanitazed[] {
    const providers: ProviderKeyValueDataSanitazed[] = []
    for (let key in this.providers) {
      providers.push(this.providers[key].data)
    }
    return providers
  }

  public getProvider(key: string): ProviderKeyValueSanitazed {
    const provider = this.providers[key]
    if (!provider) {
      throw new ProviderNotFoundException('Provider not found', 404)
    }
    return provider
  }

  public addProvider(socket: Socket, data: ProviderKeyValueData) {
    // TODO
    // Verify hash(secret) = hash
    // Register name and hash in DB as user
    this.providers[data.hash] = { socket, data: this.sanitzeData(data) }
  }

  public removeProvider(key: string) {
    delete this.providers[key]
  }

  private sanitzeData(data: ProviderKeyValueData): ProviderKeyValueDataSanitazed {
    const { secret, ...dataSanitazed } = data
    return dataSanitazed
  }
}

export default new ProviderService()
