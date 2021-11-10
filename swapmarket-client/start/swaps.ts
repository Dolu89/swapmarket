import mempoolJS from '@mempool/mempool.js'
import { crypto, ECPair, networks, opcodes, Payment, payments, Psbt, script } from 'bitcoinjs-lib'
import varuint from 'varuint-bitcoin'
import lnService, { pay, createChainAddress } from 'ln-service'
import Swap from 'App/Models/Swap'
import { Tx } from '@mempool/mempool.js/lib/interfaces/bitcoin/transactions'
import axios from 'axios'

// 60 sec
const loopDuration = 10 * 1000
const network = networks.regtest

const {
  bitcoin: { addresses },
} = mempoolJS({
  hostname: 'localhost',
})
const { lnd } = lnService.authenticatedLndGrpc({
  cert: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNKakNDQWN5Z0F3SUJBZ0lRYzE4NFFkUWdJdlE1RWxoQ0Y3Z0dPakFLQmdncWhrak9QUVFEQWpBeE1SOHcKSFFZRFZRUUtFeFpzYm1RZ1lYVjBiMmRsYm1WeVlYUmxaQ0JqWlhKME1RNHdEQVlEVlFRREV3VmpZWEp2YkRBZQpGdzB5TVRBME1EWXhOak13TWpsYUZ3MHlNakEyTURFeE5qTXdNamxhTURFeEh6QWRCZ05WQkFvVEZteHVaQ0JoCmRYUnZaMlZ1WlhKaGRHVmtJR05sY25ReERqQU1CZ05WQkFNVEJXTmhjbTlzTUZrd0V3WUhLb1pJemowQ0FRWUkKS29aSXpqMERBUWNEUWdBRUtTUURoaGVUam12dXRPckszZG9YNFRnTHM2QUpRbTVhOEh3dE1oTkZPZUFrUHlPcwoxaHgwRzdqZmZqWWErWlk2d0M4cER2cUIwOE1BL0RselhOSWVHS09CeFRDQndqQU9CZ05WSFE4QkFmOEVCQU1DCkFxUXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3RHdZRFZSMFRBUUgvQkFVd0F3RUIvekFkQmdOVkhRNEUKRmdRVXVNNzJzN0l5cTREWkhaZHBYcmpIVlJRZk9lb3dhd1lEVlIwUkJHUXdZb0lGWTJGeWIyeUNDV3h2WTJGcwphRzl6ZElJRlkyRnliMnlDRG5CdmJHRnlMVzR4TFdOaGNtOXNnZ1IxYm1sNGdncDFibWw0Y0dGamEyVjBnZ2RpCmRXWmpiMjV1aHdSL0FBQUJoeEFBQUFBQUFBQUFBQUFBQUFBQUFBQUJod1NzR3dBRU1Bb0dDQ3FHU000OUJBTUMKQTBnQU1FVUNJUUNlY1Z6TUoycU5JYmY2d1hwMlpnVWJGM3JkcTFHVkZrcVVwUE9iT3M0Nit3SWdJRHNCcFZtNwpBMG1EUUlZZ2UzdWFESDFMWlRwSWJQWEkwR015RzJyd0ZnUT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
  macaroon:
    'AgEDbG5kAvgBAwoQVcKg7h15Xe4FwmD+ooGXahIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgUJ1owUSQKaio1Rm1fUqeAvNahttYwugdtniLqTS2m1s=',
  socket: '127.0.0.1:10003',
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
          Number.parseInt(currentVout.value.toString()) === swap.satoshis_to_pay
        ) {
          if (currentTx.status.confirmed) {
            //Get the swap from DB + set vout index
            swap.contract_vout_index = index
            await swap.save()

            let preImage: string | null = null
            // Pay only if not already payed
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
                swap.satoshis_to_pay,
                swap.miner_fees,
                preImage
              )
              swap.contract_tx_claimed = claimTx
              await swap.save()
              const result = await axios.post('http://localhost/api/tx', claimTx)
              console.log(result)
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
  minerFees: number,
  preImage: string
): Promise<string> => {
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

  const { address } = await createChainAddress({ format: 'p2wpkh', lnd })
  psbt.addOutput({
    address: address,
    value: amount - minerFees,
  })

  psbt.signInput(0, ecPairSwapProvider)

  const getFinalScripts = (inputIndex: number, input: any, witnessScript: Buffer) => {
    // Step 1: Check to make sure the meaningful locking script matches what you expect.
    const decompiled = script.decompile(witnessScript)
    if (!decompiled || decompiled[0] !== opcodes.OP_HASH160) {
      throw new Error(`Can not finalize input #${inputIndex}`)
    }

    let payment: Payment = {
      network,
      output: witnessScript,
      // This logic should be more strict and make sure the pubkeys in the
      // meaningful script are the ones signing in the PSBT etc.
      input: script.compile([input.partialSig![0].signature, opcodes.OP_TRUE]),
    }
    payment = payments.p2wsh({
      network,
      redeem: payment,
    })

    const witnessStackClaimBranch = payments.p2wsh({
      redeem: {
        input: script.compile([input.partialSig[0].signature, Buffer.from(preImage, 'hex')]),
        output: Buffer.from(scriptHex, 'hex'),
      },
    })

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
