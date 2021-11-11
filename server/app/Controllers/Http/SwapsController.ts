import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProviderService from 'App/Services/ProvidersService'
import { payments, networks, ECPair } from 'bitcoinjs-lib'
import bip65 from 'bip65'
import { decode } from '@node-lightning/invoice'
import mempoolJS from '@mempool/mempool.js'
import { schema } from '@ioc:Adonis/Core/Validator'
import SwapContractService from 'App/Services/SwapContractService'
import FeesService from 'App/Services/FeesService'
import crypto from 'crypto'

export default class SwapsController {
  public async create({ request, response }: HttpContextContract) {
    const createSwapSchema = schema.create({
      invoice: schema.string({ trim: true, escape: true }),
      providerId: schema.string({ trim: true, escape: true }),
    })
    const payload = await request.validate({ schema: createSwapSchema })

    const provider = ProviderService.getProvider(payload.providerId)
    const network = networks.regtest

    const refundECpair = ECPair.makeRandom({ network })

    const {
      bitcoin: { blocks, fees },
    } = mempoolJS({
      hostname: 'mempool.space',
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

    const { fastestFee } = await fees.getFeesRecommended()
    const brokerFees = invoiceSats * (provider.data.fees / 100)
    const minerFees =
      fastestFee * FeesService.getByteCount({ 'MULTISIG-P2WSH:2-3': 1 }, { P2WPKH: 1 })

    const totalSats = invoiceSats + brokerFees + minerFees

    const uniqueId = crypto.randomUUID()

    provider.socket.emit('swap:created', {
      id: uniqueId,
      swapAddress: p2wsh.address,
      script: swapContract.toString('hex'),
      invoice: payload.invoice,
      amount: totalSats,
      minerFees,
    })

    return response
      .redirect()
      .withQs({
        swap: {
          provider: provider.data.publicKey,
          swapAddress: p2wsh.address,
          script: swapContract.toString('hex'),
          amount: totalSats,
        },
      })
      .toRoute('SwapsController.view', {
        uuid: uniqueId,
      })
  }

  public async view({ inertia, request }: HttpContextContract) {
    const { uuid } = request.params()
    const { swap } = request.qs()
    if (swap !== undefined && swap !== '') {
      // From swap creation only
      return inertia.render(`swap`, {
        uuid: uuid,
        swap,
      })
    }

    return inertia.render(`swap`, {
      uuid: uuid,
    })
  }
}
