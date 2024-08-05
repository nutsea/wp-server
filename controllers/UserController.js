const { User } = require('../models/models')
const ApiError = require('../error/apiError')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, or } = require('sequelize')

const generateJwt = (id, name, role) => {
    return jwt.sign(
        { id, name, role },
        process.env.SECRET_KEY,
        { expiresIn: '30d' }
    )
}

class UserController {
    async checkUser(req, res, next) {
        try {
            const token = generateJwt(req.user.id, req.user.name, req.user.role)
            const user = await User.findOne({ where: { id: req.user.id } })
            return res.json({ token, user })
        } catch (e) {
            console.log(e)
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
            await user.save()
            return res.json(user)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async setPassword(req, res, next) {
        try {
            const { password } = req.body
            const user = await User.findOne({ where: { id: req.user.id } })
            const hashPassword = await bcrypt.hash(password, 5)
            user.password = hashPassword
            await user.save()
            return res.json({ user, error: false, message: 'Пароль успешно установлен' })
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async changePassword(req, res, next) {
        try {
            const { oldPass, newPass } = req.body
            const user = await User.findOne({ where: { id: req.user.id } })
            let comparePassword = bcrypt.compareSync(oldPass, user.password)
            if (comparePassword) {
                const hashPassword = await bcrypt.hash(newPass, 5)
                user.password = hashPassword
                await user.save()
                return res.json({ user, error: false, message: 'Пароль успешно изменен' })
            } else {
                return res.json({ error: true, message: 'Неверный пароль' })
            }
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async login(req, res, next) {
        try {
            const { phone, password } = req.query
            const user = await User.findOne({ where: { phone } })
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'))
            }
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) {
                return next(ApiError.badRequest('Неверный пароль'))
            }
            const token = generateJwt(user.id, user.email, user.role)
            return res.json({ token, user })
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async getUser(req, res, next) {
        try {
            const { id } = req.query
            const user = await User.findOne({ where: { id } })
            return res.json(user)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async getAll(req, res, next) {
        try {
            const { search } = req.query
            const users = await User.findAll({
                where: {
                    ...(search && {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                            { surname: { [Op.iLike]: `%${search}%` } },
                            { email: { [Op.iLike]: `%${search}%` } },
                            { phone: { [Op.iLike]: `%${search}%` } },
                            { link: { [Op.iLike]: `%${search}%` } }
                        ]
                    })
                }
            })
            return res.json(users)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }

    async updateRoles(req, res, next) {
        try {
            const { idArr, role } = req.body
            const users = await User.findAll({ where: { id: { [Op.in]: idArr } } })
            for (let i of users) {
                if (i.id !== req.user.id) {
                    i.role = role
                    await i.save()
                }
            }
            return res.json(users)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e))
        }
    }
}

module.exports = new UserController()