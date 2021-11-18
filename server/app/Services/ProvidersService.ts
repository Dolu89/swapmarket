import ProviderNotFoundException from 'App/Exceptions/ProviderNotFoundException'
import {
  ProviderKeyValueData,
  ProviderKeyValueDataSanitized,
  ProviderKeyValueSanitized,
} from 'App/Models/ProviderKeyValue'
import { Socket } from 'socket.io'

class ProviderService {
  private providers: { [key: string]: ProviderKeyValueSanitized }

  constructor() {
    this.providers = {}
  }

  public getProviders(): ProviderKeyValueDataSanitized[] {
    const providers: ProviderKeyValueDataSanitized[] = []
    for (let key in this.providers) {
      providers.push(this.providers[key].data)
    }
    return providers
  }

  public getProvider(key: string): ProviderKeyValueSanitized {
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

  private sanitzeData(data: ProviderKeyValueData): ProviderKeyValueDataSanitized {
    const { secret, ...dataSanitized } = data
    return dataSanitized
  }
}

export default new ProviderService()
