const { Fav } = require('../models/models')
const ApiError = require('../error/apiError')

class FavController {
    async create(req, res, next) {
        try {
            const { item_uid, client_id } = req.body
            const item = await Fav.create({ item_uid, client_id })
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getUserFav(req, res, next) {
        try {
            const { client_id } = req.query
            const fav = await Fav.findAll({ where: { client_id } })
            return res.json(fav)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async deleteOne(req, res, next) {
        try {
            const { item_uid, client_id } = req.query
            const item = await Fav.findOne({ where: { item_uid, client_id } })
            await item.destroy()
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new FavController()