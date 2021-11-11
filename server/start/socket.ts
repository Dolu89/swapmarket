import { ProviderKeyValueData } from 'App/Models/ProviderKeyValue'
import ProvidersService from 'App/Services/ProvidersService'
import Ws from 'App/Services/Ws'
Ws.boot()

Ws.io.on('connection', (socket) => {
  socket.on('provider:connect', async (data: ProviderKeyValueData) => {
    ProvidersService.addProvider(socket, data)
    const provider = ProvidersService.getProvider(data.hash)
    provider.socket.emit('test', 'It works!')
  })

  socket.on('swap:completed', (id: string) => {
    socket.emit('swap:completed', id)
  })
})
