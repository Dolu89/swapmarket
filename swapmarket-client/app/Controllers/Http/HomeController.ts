import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Swap from 'App/Models/Swap'

export default class HomeController {
  public async index({ inertia }: HttpContextContract) {
    const swaps = await Swap.all()
    return inertia.render('index', { swaps })
  }
}
