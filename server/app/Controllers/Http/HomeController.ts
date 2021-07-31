import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProviderService from 'App/Services/ProvidersService'

export default class HomeController {
  public async index({ inertia }: HttpContextContract) {
    const providers = ProviderService.getProviders()
    return inertia.render('index', { providers })
  }
}
