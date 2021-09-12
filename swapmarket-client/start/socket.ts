import { networks, ECPair } from 'bitcoinjs-lib'
import Ws from 'App/Services/Ws'
import SwapService from 'App/Services/SwapService'
Ws.boot()

Ws.client.on('connect', () => {
  // TODO get data from env var
  // TODO Remove wif. Regtest wif for dev only
  const wif = 'cVJvJCCDE1tJnjmAyu4LHDf1uM8NUSS8r6QA65zRX5veLxtqdaqd'
  const ecPairSwapProvider = ECPair.fromWIF(wif, networks.regtest)
  const data = {
    name: 'Dolu',
    hash: '12456',
    secret: '456789',
    publicKey: ecPairSwapProvider.publicKey.toString('hex'),
    fees: 0.5,
  }
  Ws.client.emit('provider:connect', data)
})

Ws.client.on(
  'newSwap',
  async (data: { swapAddress: string; script: string; invoice: string; amount: number }) => {
    await SwapService.addSwap(data.swapAddress, data.script, data.invoice, data.amount)
  }
)
