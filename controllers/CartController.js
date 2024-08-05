const { Cart, Item, Photo, Size } = require('../models/models')
const ApiError = require('../error/apiError')

class CartController {
    async create(req, res, next) {
        try {
            const { item_uid, size, client_id, ship } = req.body
            const item = await Cart.create({ item_uid, size, client_id, ship })
            console.log(item)
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getUserCart(req, res, next) {
        try {
            const { client_id } = req.query
            const items = await Cart.findAll({ where: { client_id } })
            let newItems = []
            if (Array.isArray(items)) {
                for (let i of items) {
                    let item = await Item.findOne({ where: { item_uid: i.item_uid } })
                    if (item) {
                        const img = await Photo.findOne({ where: { item_uid: item.dataValues.item_uid } })
                        item.dataValues.img = img.dataValues.img
                        item.dataValues.size = i.size
                        item.dataValues.ship = i.ship
                        // newItems.push(item)
                        const price = await Size.findOne({ where: { item_uid: item.dataValues.item_uid, size: item.dataValues.size } })
                        if (price) {
                            newItems.push(item)
                        }
                    }
                }
                for (let i = 0; i < newItems.length; i++) {
                    const price = await Size.findOne({ where: { item_uid: newItems[i].dataValues.item_uid, size: newItems[i].dataValues.size } })
                    // newItems[i].dataValues.price = price.dataValues.price
                    if (price) {
                        newItems[i].dataValues.price = price.dataValues.price
                    }
                }
            }
            return res.json(newItems)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async deleteOne(req, res, next) {
        try {
            const { id, size, user, ship } = req.query
            let item
            if (ship) item = await Cart.findOne({ where: { item_uid: id, size, client_id: user, ship } })
            else item = await Cart.findOne({ where: { item_uid: id, size, client_id: user } })
            await item.destroy()
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async clearUserCart(req, res, next) {
        try {
            const items = await Cart.findAll({ where: { client_id: req.user.id } })
            for (let i of items) {
                await i.destroy()
            }
            return res.json(items)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new CartController()