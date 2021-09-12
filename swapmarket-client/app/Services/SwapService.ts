import Swap from 'App/Models/Swap'

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
  }
}

export default new SwapService()
