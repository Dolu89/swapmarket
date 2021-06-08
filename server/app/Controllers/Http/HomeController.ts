import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class HomeController {
    public async index({ inertia }: HttpContextContract) {
        const brokers = [];

        return inertia.render('index', { brokers });
    }
}