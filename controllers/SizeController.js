const { Size } = require('../models/models')
const ApiError = require('../error/apiError')

class SizeController {
    async create(req, res, next) {
        try {
            const { id, size, price, item_uid } = req.body
            const size_item = await Size.create({ id, size, price, item_uid })
            return res.json(size_item)
        } catch (error) {
            return next(ApiError.badRequest(error.message))
        }
    }
}

module.exports = new SizeController()