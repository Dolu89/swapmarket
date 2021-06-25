import ws from 'ws'
import { brokerHandler } from './BrokerHandler'

export const handle = async (message: string, wsClient: ws) => {
  const body = JSON.parse(message)

  if (body.source.name === 'broker') {
    brokerHandler(body, wsClient)
  } else if (body.source.name === 'client') {
  }
}
