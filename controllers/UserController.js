const { User } = require('../models/models')
const ApiError = require('../error/apiError')
const jwt = require('jsonwebtoken')

const generateJwt = (id, name, phone) => {
    return jwt.sign(
        { id, name, phone },
        process.env.SECRET_KEY,
        { expiresIn: '30d' }
    )
}

class UserController {
    async checkUser(req, res, next) {
        try {
            const token = generateJwt(req.user.id, req.user.name, req.user.phone)
            const user = await User.findOne({ where: { id: req.user.id } })
            return res.json({ token, user })
        } catch (e) {
            return next(ApiError.forbidden(e))
        }
    }

    async update(req, res, next) {
        try {
            const { name, surname, email } = req.body
            const user = await User.findOne({ where: { id: req.user.id } })
            if (name) user.name = name
            if (surname) user.surname = surname
            if (email) user.email = email
            console.log(user)
            await user.save()
            return res.json(user)
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }
}

module.exports = new UserController()