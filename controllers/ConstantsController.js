const { Constants } = require('../models/models')
const ApiError = require('../error/apiError')

class ConstantsController {
    async update(req, res, next) {
        try {
            const { name, value } = req.body
            const constant = await Constants.findOne({ where: { name } })
            constant.value = value
            await constant.save()
            return res.json(constant)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getConstant(req, res, next) {
        try {
            const { name } = req.query
            const constant = await Constants.findOne({ where: { name } })
            return res.json(constant)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new ConstantsController()