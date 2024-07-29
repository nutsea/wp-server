const { Order, OrderItem, Photo, OrderPhoto, Item } = require('../models/models')
const ApiError = require('../error/apiError')

class OrderController {
    async create(req, res, next) {
        try {
            const { name, social_media, checked_price, recipient, phone, address, ship_type, delivery_cost, is_split, course, fee, cost, discount_cost, discount, promo_code, items } = req.body
            const order = await Order.create({ name, social_media, checked_price, recipient, phone, address, ship_type, delivery_cost, is_split, course, fee, cost, discount_cost, discount, promo_code, client_id: req.user.id })
            for (let i of items) {
                await Photo.findOne({ where: { item_uid: i.item_uid } }).then(async data => {
                    await Item.findOne({ where: { item_uid: i.item_uid } }).then(async item => {
                        await OrderItem.create({
                            item_uid: i.item_uid,
                            name: i.name,
                            img: data.img,
                            category: item.category,
                            model: item.model ? item.model : '',
                            size: i.size,
                            ship: i.ship,
                            cny_cost: i.cny_cost,
                            rub_cost: i.rub_cost,
                            order_id: order.id
                        })
                    })
                })
            }
            return res.json(order)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res) {
        try {
            const { status } = req.query
            const orders = await Order.findAll({ where: { status } })
            return res.json(orders)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOne(req, res) {
        const { id } = req.query
        const order = await Order.findOne({ where: { id } })
        return res.json(order)
    }

    async getClientOrders(req, res, next) {
        try {
            const orders = await Order.findAll({ where: { client_id: req.user.id } })
            return res.json(orders)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOrderItems(req, res, next) {
        try {
            const { id } = req.query
            const items = await OrderItem.findAll({ where: { order_id: id } })
            return res.json(items)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOrderReport(req, res, next) {
        try {
            const { id, type } = req.query
            const report = await OrderPhoto.findOne({ where: { id, type } })
            return res.json(report)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new OrderController()