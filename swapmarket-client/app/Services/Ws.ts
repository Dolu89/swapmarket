import { io, Socket } from 'socket.io-client'

class Ws {
  public client: Socket
  private booted = false

  public boot() {
    /**
     * Ignore multiple calls to the boot method
     */
    if (this.booted) {
      return
    }

    this.booted = true
    this.client = io('http://localhost:3333', {
      path: '/ws',
    })
  }
}

export default new Ws()
