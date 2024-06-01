const { Auth, User } = require('../models/models')
const ApiError = require('../error/apiError')
const jwt = require('jsonwebtoken')

const generateJwt = (id, name, phone) => {
    return jwt.sign(
        { id, name, phone },
        process.env.SECRET_KEY,
        { expiresIn: '30d' }
    )
}

class AuthController {
    async create(req, res, next) {
        try {
            const { code } = req.body
            const auth = await Auth.create({ code })
            return res.json(auth)
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    async authUser(req, res, next) {
        try {
            const { code } = req.query
            const auth = await Auth.findOne({ where: { code: code } })
            if (auth) {
                const user = await User.findOne({ where: { phone: auth.phone } })
                const token = generateJwt(user.id, user.name, user.phone)
                await auth.destroy()
                return res.json(token)
            } else {
                return next(ApiError.badRequest())
            }
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }
}

module.exports = new AuthController()