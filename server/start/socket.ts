import ws from 'ws'
import Server from '@ioc:Adonis/Core/Server'
import { handle } from 'App/WebSockets/SocketHandler'

/**
 * Pass AdonisJS http server instance to ws.
 */
const wss = new ws.Server({ server: Server.instance! })

wss.on('connection', (ws: ws) => {
  ws.on('message', async (message: string) => {
    await handle(message, ws)
  })
})
