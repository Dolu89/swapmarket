import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProviderService from 'App/Services/ProvidersService'

export default class ProvidersController {
  public async index({ inertia, params }: HttpContextContract) {
    const provider = ProviderService.getProvider(params.id)
    return inertia.render('provider', { provider: provider.data })
  }
}
