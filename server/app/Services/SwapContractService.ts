import { script, crypto } from 'bitcoinjs-lib'

class SwapContractService {
  public create(
    swapProviderClaimPublicKey: Buffer,
    userRefundPublicKey: Buffer,
    paymentHash: string,
    timelock: number
  ): Buffer {
    return script.fromASM(
      `
            OP_HASH160
            ${crypto.ripemd160(Buffer.from(paymentHash, 'hex')).toString('hex')}
            OP_EQUAL
            OP_IF
              ${swapProviderClaimPublicKey.toString('hex')}
            OP_ELSE
              ${script.number.encode(timelock).toString('hex')}
              OP_CHECKLOCKTIMEVERIFY
              OP_DROP
              ${userRefundPublicKey.toString('hex')}
            OP_ENDIF
            OP_CHECKSIG
            `
        .trim()
        .replace(/\s+/g, ' ')
    )
  }
}

export default new SwapContractService()
