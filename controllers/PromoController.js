const { Promo } = require('../models/models')
const ApiError = require('../error/apiError')

class PromoController {
    async create(req, res, next) {
        try {
            const { code, discount, status } = req.body
            const promo = await Promo.create({ code, discount: Number(discount), status })
            return res.json(promo)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res) {
        const promos = await Promo.findAll()
        return res.json(promos)
    }

    async getOne(req, res) {
        const { id } = req.query
        const promo = await Promo.findOne({ where: { id } })
        return res.json(promo)
    }

    async checkPromo(req, res) {
        const { promo_code } = req.query
        const promo = await Promo.findOne({ where: { code: promo_code.toLowerCase() } })
        console.log(promo)
        return res.json(promo)
    }

    async update(req, res, next) {
        try {
            const { id, code, discount, status } = req.body
            const promo = await Promo.update({ code, discount, status }, { where: { id } })
            return res.json(promo)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async delete(req, res) {
        const { id } = req.query
        const promo = await Promo.destroy({ where: { id } })
        return res.json(promo)
    }
}

module.exports = new PromoController()