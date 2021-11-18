import { Socket } from 'socket.io'

class ClientSwapsService {
  private clients: { [swapId: string]: Socket }

  constructor() {
    this.clients = {}
  }

  public getSwap(swapId: string): Socket | null {
    const swap = this.clients[swapId]
    if (!swap) {
      // throw new ProviderNotFoundException('Provider not found', 404)
      return null
    }
    return swap
  }

  public addSwap(swapId: string, socket: Socket) {
    if (!this.getSwap(swapId)) {
      this.clients[swapId] = socket
    }
  }

  public removeSwap(swapId: string) {
    delete this.clients[swapId]
  }
}

export default new ClientSwapsService()
