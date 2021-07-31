import Ws from 'App/Services/Ws'
Ws.boot()

Ws.client.on('connect', () => {
  // TODO get data from env var
  const data = { name: 'Dolu', hash: '12456', secret: '456789' }
  Ws.client.emit('provider:connect', data)
})

Ws.client.on('test', (data) => {
  console.log(data)
})
