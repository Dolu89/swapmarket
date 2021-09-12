import Swap from 'App/Models/Swap'
import mempoolJS from '@mempool/mempool.js'
import { crypto, ECPair, networks, opcodes, Payment, payments, Psbt, script } from 'bitcoinjs-lib'
import varuint from 'varuint-bitcoin'
import lnService, { pay } from 'ln-service'

class SwapService {
  public async addSwap(
    swapAddress: string,
    scriptHex: string,
    invoiceToPay: string,
    amountToPay: number
  ) {
    await Swap.create({
      swap_address: swapAddress,
      script_hex: scriptHex,
      invoice_to_pay: invoiceToPay,
      satoshis_to_pay: amountToPay,
    })

    this.checkSwapHasBeenPaid(swapAddress, amountToPay)
  }

  private checkSwapHasBeenPaid(swapAddress: string, amountToPaid: number) {
    const interval = setInterval(async () => {
      const {
        bitcoin: { transactions, addresses },
      } = mempoolJS({
        hostname: 'localhost',
        network: 'regtest',
      })

      const txs = await addresses.getAddressTxs({ address: swapAddress })

      if (txs.length === 1) {
        const currentTx = txs[0]

        currentTx.vout.forEach(async (currentVout, index) => {
          if (
            currentVout.scriptpubkey_address === swapAddress &&
            Number.parseInt(currentVout.value.toString()) === amountToPaid + 1000
          ) {
            if (currentTx.status.confirmed) {
              //Get the swap from DB + set vout index
              const swap = await Swap.query().where('swap_address', swapAddress).firstOrFail()
              swap.contract_vout_index = index
              await swap.save()

              // Pay invoice + set pre image
              const preImage = await this.payInvoice(swap.invoice_to_pay)
              swap.invoice_pre_image = preImage
              await swap.save()

              // Build claim Tx + publish Tx + set Tx hex string
              const claimTx = this.claim(
                currentTx.txid,
                swap.script_hex,
                index,
                amountToPaid + 1000,
                preImage
              )
              await transactions.postTx({ txid: claimTx })
              swap.contract_tx_claimed = claimTx
              await swap.save()

              clearInterval(interval)
            }
          }
        })
      }
    }, 10 * 1000)
  }

  // TODO Use Env var to get node information
  private async payInvoice(invoice: string): Promise<string> {
    const { lnd } = lnService.authenticatedLndGrpc({
      cert: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNJakNDQWNpZ0F3SUJBZ0lSQVA3MlAzT2YvWHdvbGkweTh3Q1BpRGt3Q2dZSUtvWkl6ajBFQXdJd01ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERU5NQXNHQTFVRUF4TUVaR0YyWlRBZQpGdzB5TVRBNU1UQXdPRFF5TlRWYUZ3MHlNakV4TURVd09EUXlOVFZhTURBeEh6QWRCZ05WQkFvVEZteHVaQ0JoCmRYUnZaMlZ1WlhKaGRHVmtJR05sY25ReERUQUxCZ05WQkFNVEJHUmhkbVV3V1RBVEJnY3Foa2pPUFFJQkJnZ3EKaGtqT1BRTUJCd05DQUFUUjlQYUV2aWxwbDRqTmFYUzF4M0dpS0dQWXNFY1BuU2tWcTZPbThwaEZHaEErM0lVWApVb25qd2ZpK2o1SUNpQ2xWUHFBbmJNbUkwRlA2OHlnVzN2cmhvNEhDTUlHL01BNEdBMVVkRHdFQi93UUVBd0lDCnBEQVRCZ05WSFNVRUREQUtCZ2dyQmdFRkJRY0RBVEFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVcKQkJRdW5NN3psRUkxT0d4VzYwVlkzdzhlRTI5MnVEQm9CZ05WSFJFRVlUQmZnZ1JrWVhabGdnbHNiMk5oYkdodgpjM1NDQkdSaGRtV0NEWEJ2YkdGeUxXNHhMV1JoZG1XQ0JIVnVhWGlDQ25WdWFYaHdZV05yWlhTQ0IySjFabU52CmJtNkhCSDhBQUFHSEVBQUFBQUFBQUFBQUFBQUFBQUFBQUFHSEJLd1NBQU13Q2dZSUtvWkl6ajBFQXdJRFNBQXcKUlFJZ1JHbXp3alUwRS9wRW93YTBHODhVUU5SVnlYUyt1WUMzaFVhY2twKzFBVk1DSVFEaWZ5THhwQWxFWkNVOAp6UDd2UkNSbkdFbnNwVmpwa0hBVUczL01KVjM5M2c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
      macaroon:
        'AgEDbG5kAvgBAwoQY0bujC1LKHoTXoBBGn+8QhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYg99qN6VB87mysiqa7iQ0PgjaatWdelI6wMXH6jIIocuY=',
      socket: '127.0.0.1:10004',
    })
    const result = await pay({ lnd, request: invoice })
    return result.secret
  }

  private claim(
    txId: string,
    scriptHex: string,
    voutIndex: number,
    amount: number,
    preImage: string
  ): string {
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
    // TODO Get a new address
    psbt.addOutput({
      address: 'bcrt1q8ahy0hajvf8gvjked8egm4ckpyu3cr59acmnj2',
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
        finalScriptWitness: this.witnessStackToScriptWitness(witnessStackClaimBranch.witness),
      }
    }

    psbt.finalizeInput(0, getFinalScripts)

    return psbt.extractTransaction().toHex()
  }

  private witnessStackToScriptWitness(witness) {
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
}

export default new SwapService()
