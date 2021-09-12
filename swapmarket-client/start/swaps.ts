import mempoolJS from '@mempool/mempool.js'
import { crypto, ECPair, networks, opcodes, Payment, payments, Psbt, script } from 'bitcoinjs-lib'
import varuint from 'varuint-bitcoin'
import lnService, { pay, createChainAddress } from 'ln-service'
import Swap from 'App/Models/Swap'
import { Tx } from '@mempool/mempool.js/lib/interfaces/bitcoin/transactions'

// 60 sec
const loopDuration = 60 * 1000

const {
  bitcoin: { transactions, addresses },
} = mempoolJS({
  hostname: 'localhost',
  network: 'regtest',
})
const { lnd } = lnService.authenticatedLndGrpc({
  cert: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNJakNDQWNpZ0F3SUJBZ0lSQVA3MlAzT2YvWHdvbGkweTh3Q1BpRGt3Q2dZSUtvWkl6ajBFQXdJd01ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERU5NQXNHQTFVRUF4TUVaR0YyWlRBZQpGdzB5TVRBNU1UQXdPRFF5TlRWYUZ3MHlNakV4TURVd09EUXlOVFZhTURBeEh6QWRCZ05WQkFvVEZteHVaQ0JoCmRYUnZaMlZ1WlhKaGRHVmtJR05sY25ReERUQUxCZ05WQkFNVEJHUmhkbVV3V1RBVEJnY3Foa2pPUFFJQkJnZ3EKaGtqT1BRTUJCd05DQUFUUjlQYUV2aWxwbDRqTmFYUzF4M0dpS0dQWXNFY1BuU2tWcTZPbThwaEZHaEErM0lVWApVb25qd2ZpK2o1SUNpQ2xWUHFBbmJNbUkwRlA2OHlnVzN2cmhvNEhDTUlHL01BNEdBMVVkRHdFQi93UUVBd0lDCnBEQVRCZ05WSFNVRUREQUtCZ2dyQmdFRkJRY0RBVEFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVcKQkJRdW5NN3psRUkxT0d4VzYwVlkzdzhlRTI5MnVEQm9CZ05WSFJFRVlUQmZnZ1JrWVhabGdnbHNiMk5oYkdodgpjM1NDQkdSaGRtV0NEWEJ2YkdGeUxXNHhMV1JoZG1XQ0JIVnVhWGlDQ25WdWFYaHdZV05yWlhTQ0IySjFabU52CmJtNkhCSDhBQUFHSEVBQUFBQUFBQUFBQUFBQUFBQUFBQUFHSEJLd1NBQU13Q2dZSUtvWkl6ajBFQXdJRFNBQXcKUlFJZ1JHbXp3alUwRS9wRW93YTBHODhVUU5SVnlYUyt1WUMzaFVhY2twKzFBVk1DSVFEaWZ5THhwQWxFWkNVOAp6UDd2UkNSbkdFbnNwVmpwa0hBVUczL01KVjM5M2c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
  macaroon:
    'AgEDbG5kAvgBAwoQY0bujC1LKHoTXoBBGn+8QhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYg99qN6VB87mysiqa7iQ0PgjaatWdelI6wMXH6jIIocuY=',
  socket: '127.0.0.1:10004',
})

setInterval(async () => {
  await checkSwaps()
}, loopDuration)

const checkSwaps = async () => {
  // Get all swaps not claimed yet
  const swapsToCheck = await Swap.query().where('contract_finalized', false)
  console.log(`${swapsToCheck.length} swap(s) to check`)

  for (const swap of swapsToCheck) {
    let txs: Tx[] = []
    try {
      txs = await addresses.getAddressTxs({ address: swap.swap_address })
    } catch (error) {
      swap.error = error
      continue
    }

    if (txs.length === 1) {
      const currentTx = txs[0]

      let index = 0
      for (const currentVout of currentTx.vout) {
        if (
          currentVout.scriptpubkey_address === swap.swap_address &&
          Number.parseInt(currentVout.value.toString()) === swap.satoshis_to_pay + 1000
        ) {
          if (currentTx.status.confirmed) {
            //Get the swap from DB + set vout index
            swap.contract_vout_index = index
            await swap.save()

            let preImage: string | null = null
            // Pay only if not payed already
            if (swap.invoice_pre_image === null) {
              try {
                // Pay invoice + set pre image
                preImage = await payInvoice(swap.invoice_to_pay)
                swap.invoice_pre_image = preImage
                await swap.save()
              } catch (error) {
                swap.error = error
                await swap.save()
                continue
              }
            } else {
              preImage = swap.invoice_pre_image
            }

            try {
              // Build claim Tx + publish Tx + set Tx hex string
              const claimTx = await claim(
                currentTx.txid,
                swap.script_hex,
                index,
                swap.satoshis_to_pay + 1000,
                preImage
              )
              swap.contract_tx_claimed = claimTx
              await swap.save()
              await transactions.postTx({ txid: claimTx })
            } catch (error) {
              swap.error = error
              await swap.save()
              continue
            }

            swap.contract_finalized = true
            await swap.save()
          }
        }

        index++
      }
    }
  }
}

// TODO Use Env var to get node information
const payInvoice = async (invoice: string): Promise<string> => {
  const result = await pay({ lnd, request: invoice })
  return result.secret
}

const claim = async (
  txId: string,
  scriptHex: string,
  voutIndex: number,
  amount: number,
  preImage: string
): Promise<string> => {
  const network = networks.regtest
  const wif = 'cVJvJCCDE1tJnjmAyu4LHDf1uM8NUSS8r6QA65zRX5veLxtqdaqd'
  const ecPairSwapProvider = ECPair.fromWIF(wif, network)
  const psbt = new Psbt({ network })

  psbt.addInput({
    hash: txId,
    index: voutIndex,
    sequence: 0xfffffffe,
    witnessUtxo: {
      script: Buffer.from(
        '0020' + crypto.sha256(Buffer.from(scriptHex, 'hex')).toString('hex'),
        'hex'
      ),
      value: amount,
    },
    witnessScript: Buffer.from(scriptHex, 'hex'),
  })

  // TODO Add miner fees
  const { address } = await createChainAddress({ format: 'p2wpkh', lnd })
  psbt.addOutput({
    address: address,
    value: amount - 1000,
  })

  psbt.signInput(0, ecPairSwapProvider)

  const getFinalScripts = (inputIndex: number, input: any, witnessScript: Buffer) => {
    // Step 1: Check to make sure the meaningful locking script matches what you expect.
    const decompiled = script.decompile(witnessScript)
    if (!decompiled || decompiled[0] !== opcodes.OP_HASH160) {
      throw new Error(`Can not finalize input #${inputIndex}`)
    }

    let payment: Payment = {
      network: networks.regtest,
      output: witnessScript,
      // This logic should be more strict and make sure the pubkeys in the
      // meaningful script are the ones signing in the PSBT etc.
      input: script.compile([input.partialSig![0].signature, opcodes.OP_TRUE]),
    }
    payment = payments.p2wsh({
      network: networks.regtest,
      redeem: payment,
    })

    const witnessStackClaimBranch = payments.p2wsh({
      redeem: {
        input: script.compile([input.partialSig[0].signature, Buffer.from(preImage, 'hex')]),
        output: Buffer.from(scriptHex, 'hex'),
      },
    })
    // console.log('First branch witness stack:')
    // console.log(witnessStackClaimBranch.witness.map((x) => x.toString('hex')))

    return {
      finalScriptSig: payment.input,
      finalScriptWitness: witnessStackToScriptWitness(witnessStackClaimBranch.witness),
    }
  }

  psbt.finalizeInput(0, getFinalScripts)

  return psbt.extractTransaction().toHex()
}

const witnessStackToScriptWitness = (witness) => {
  let buffer = Buffer.allocUnsafe(0)

  function writeSlice(slice) {
    buffer = Buffer.concat([buffer, Buffer.from(slice)])
  }

  function writeVarInt(i) {
    const currentLen = buffer.length
    const varintLen = varuint.encodingLength(i)

    buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)])
    varuint.encode(i, buffer, currentLen)
  }

  function writeVarSlice(slice) {
    writeVarInt(slice.length)
    writeSlice(slice)
  }

  function writeVector(vector) {
    writeVarInt(vector.length)
    vector.forEach(writeVarSlice)
  }

  writeVector(witness)

  return buffer
}
