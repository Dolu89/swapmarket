import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProviderService from 'App/Services/ProvidersService'
import { payments, networks, ECPair } from 'bitcoinjs-lib'
import bip65 from 'bip65'
import { decode } from '@node-lightning/invoice'
import mempoolJS from '@mempool/mempool.js'
import { schema } from '@ioc:Adonis/Core/Validator'
import SwapContractService from 'App/Services/SwapContractService'

export default class SwapsController {
  public async create({ inertia, request }: HttpContextContract) {
    const createSwapSchema = schema.create({
      invoice: schema.string({ trim: true, escape: true }),
      providerId: schema.string({ trim: true, escape: true }),
    })
    const payload = await request.validate({ schema: createSwapSchema })

    const provider = ProviderService.getProvider(payload.providerId)
    const network = networks.regtest

    const refundECpair = ECPair.makeRandom({ network })

    const {
      bitcoin: { blocks },
    } = mempoolJS({
      hostname: 'localhost',
      network: 'regtest', // 'signet' | 'testnet' | 'mainnet'
    })
    const blocksTipHeight = await blocks.getBlocksTipHeight()

    const timelock = bip65.encode({ blocks: blocksTipHeight + 10 })

    const decodedInvoice = decode(payload.invoice)

    const paymentHash = decodedInvoice.paymentHash.toString('hex')

    const swapContract = SwapContractService.create(
      Buffer.from(provider.data.publicKey, 'hex'),
      Buffer.from(refundECpair.publicKey.toString('hex'), 'hex'),
      paymentHash,
      timelock
    )

    const p2wsh = payments.p2wsh({
      redeem: { output: swapContract, network },
      network,
    })

    const invoiceSats = Number(decodedInvoice.valueMsat) / 1000

    const brokerFees = invoiceSats * (provider.data.fees / 100)

    // const { fastestFee } = await fees.getFeesRecommended()
    //TODO add miner fees
    const totalSats = invoiceSats + brokerFees

    provider.socket.emit('newSwap', {
      swapAddress: p2wsh.address,
      script: swapContract.toString('hex'),
      invoice: payload.invoice,
      amount: totalSats,
    })

    return inertia.render('swap', {
      swap: {
        swapAddress: p2wsh.address,
        script: swapContract.toString('hex'),
        amount: invoiceSats,
        brokerFees,
        // miningFees: fastestFee,
      },
    })
  }
}
