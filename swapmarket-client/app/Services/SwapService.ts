import Swap from 'App/Models/Swap'

class SwapService {
  public async addSwap(
    swapAddress: string,
    scriptHex: string,
    invoiceToPay: string,
    amountToPay: number,
    minerFees: number
  ) {
    await Swap.create({
      swap_address: swapAddress,
      script_hex: scriptHex,
      invoice_to_pay: invoiceToPay,
      satoshis_to_pay: amountToPay,
      miner_fees: minerFees,
    })
  }
}

export default new SwapService()
