const { Item, Photo, Size } = require('../models/models')
const ApiError = require('../error/apiError')
const { Op } = require('sequelize')
const { getPoizonItem } = require('../services/poizonService')

function filterString(str) {
    const regex = /[^a-zA-Zа-яА-Я0-9 ]/g
    return str.replace(regex, '')
}

function translateToSM(str) {
    if (str === "适合脚长") return "SM"
}

function convertStringToArray(sizesString) {
    const sizesArray = sizesString.split(',').map(item => parseFloat(item.trim()))
    return sizesArray
}

class ItemController {
    async create(req, res, next) {
        try {
            const { name, item_uid, category, brand, model, orders } = req.body
            const item = await Item.create({ name, item_uid, category, brand, model, orders })
            return res.json(item)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async createBySpuId(req, res, next) {
        try {
            const { spuIdArr, category } = req.body
            let items = []
            let error = false
            for (let i of spuIdArr) {
                try {
                    await getPoizonItem(i).then(async data => {
                        try {
                            const isItem = await Item.findOne({ where: { item_uid: i.toString() } })
                            if (!isItem) {
                                const item = await Item.create({ name: filterString(data.detail.originalTitle), item_uid: i.toString(), category, brand: filterString(data.brandRootInfo.brandItemList[0].brandName), model: filterString(data.detail.originalTitle), orders: 0 })
                                items.push(item)
                            }
                            for (let j of data.image.spuImage.images) {
                                const isPhoto = await Photo.findOne({ where: { img: j.url, item_uid: i.toString() } })
                                if (!isPhoto)
                                    await Photo.create({ img: j.url, item_uid: i.toString() })
                            }
                            let list = data.sizeDto.sizeInfo.sizeTemplate.list
                            for (let j of list) {
                                if (j.sizeKey === '适合脚长') j.sizeKey = 'SM'
                                j.sizeKey = filterString(j.sizeKey)
                                j.sizeValue = convertStringToArray(j.sizeValue)
                            }
                            for (let j = 0; j < data.skus.length; j++) {
                                for (let k of list) {
                                    try {
                                        const isSize = await Size.findOne({ where: { size: k.sizeValue[j].toString(), item_uid: i.toString(), size_type: k.sizeKey } })
                                        if (!isSize) {
                                            await Size.create({ size: k.sizeValue[j], price: data.skus[j].price.prices[0].price, item_uid: i.toString(), size_type: k.sizeKey, size_default: list[0].sizeValue[j], item_category: category })
                                        }
                                        else {
                                            isSize.price = data.skus[j].price.prices[0].price
                                            await isSize.save()
                                        }
                                    } catch (e) {
                                        console.log(e)
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(e)
                        }
                    })
                } catch (e) {
                    console.log(e)
                    error = true
                }
            }
            return res.json({ items, error })
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async checkCost(req, res, next) {
        try {
            const { spuIdArr } = req.query
            let ids = JSON.parse(spuIdArr)
            let sizes = []
            for (let i of ids) {
                await getPoizonItem(i).then(async data => {
                    let list = data.sizeDto.sizeInfo.sizeTemplate.list
                    for (let j of list) {
                        if (j.sizeKey === '适合脚长') j.sizeKey = 'SM'
                        j.sizeKey = filterString(j.sizeKey)
                        j.sizeValue = convertStringToArray(j.sizeValue)
                    }
                    for (let j = 0; j < data.skus.length; j++) {
                        for (let k of list) {
                            const isSize = await Size.findOne({ where: { size: k.sizeValue[j].toString(), item_uid: i.toString(), size_type: k.sizeKey } })
                            if (!isSize) {
                                const size = await Size.create({ size: k.sizeValue[j], price: data.skus[j].price.prices[0].price, item_uid: i.toString(), size_type: k.sizeKey, size_default: list[0].sizeValue[j], item_category: category })
                                sizes.push(size)
                            }
                            else {
                                isSize.price = data.skus[j].price.prices[0].price
                                await isSize.save()
                                sizes.push(isSize)
                            }
                        }
                    }
                })
            }
            return res.json(sizes)
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const { id } = req.query
            let item = await Item.findOne({ where: { id } })
            const images = await Photo.findAll({ where: { item_uid: item.dataValues.item_uid } })
            item.dataValues.img = images
            const sizes = await Size.findAll({ where: { item_uid: item.dataValues.item_uid } })
            item.dataValues.sizes = sizes
            return res.json(item)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getPopular(req, res) {
        let items = await Item.findAndCountAll({
            limit: 10
        })
        for (let i = 0; i < items.rows.length; i++) {
            const img = await Photo.findOne({ where: { item_uid: items.rows[i].dataValues.item_uid } })
            items.rows[i].dataValues.img = img.dataValues.img
            const prices = await Size.findAll({ where: { item_uid: items.rows[i].dataValues.item_uid } })
            let minPrice = 1000000000
            for (let j = 0; j < prices.length; j++) {
                if (prices[j].dataValues.price < minPrice) {
                    minPrice = prices[j].dataValues.price
                }
            }
            items.rows[i].dataValues.minPrice = minPrice
        }
        return res.json(items)
    }

    async getAll(req, res, next) {
        try {
            const { category, brands, models, sizes, size_type, prices, sort, limit, page } = req.query
            const sizesDB = await Size.findAll({
                where: {
                    ...(category && { item_category: category }),
                    size_type,
                    ...(sizes && { size: { [Op.in]: sizes } }),
                    ...(prices && { price: { [Op.gte]: prices[0], [Op.lte]: prices[1] } }),
                },
            })
            let pageClient = Number(page) || 1
            let limitClient = Number(limit) || 18
            let offset = Number(pageClient) * Number(limitClient) - Number(limitClient)
            let conditions = {}
            if (models && brands) {
                conditions = {
                    [Op.or]: [
                        ...models.map(m => ({
                            brand: m.brand,
                            model: m.model
                        })),
                        {
                            brand: {
                                [Op.in]: brands.filter(b => !models.some(m => m.brand === b))
                            }
                        }
                    ]
                }
            } else if (brands) {
                conditions = { ...(brands && { brand: { [Op.in]: brands } }) }
            }

            let items = await Item.findAll({
                where: {
                    ...(category && { category }),
                    ...(sizesDB && { item_uid: { [Op.in]: sizesDB.map(item => item.item_uid) } }),
                    ...(brands && conditions)
                },
            })

            for (let i = 0; i < items.length; i++) {
                const img = await Photo.findOne({ where: { item_uid: items[i].dataValues.item_uid } })
                items[i].dataValues.img = img.dataValues.img
                const prices = await Size.findAll({ where: { item_uid: items[i].dataValues.item_uid } })
                let minPrice = 1000000000
                for (let j = 0; j < prices.length; j++) {
                    if (prices[j].dataValues.price < minPrice) {
                        minPrice = prices[j].dataValues.price
                    }
                }
                items[i].dataValues.minPrice = minPrice
            }

            switch (sort) {
                case 'new':
                    items.sort((a, b) => a.createdAt - b.createdAt);
                    break;

                case 'old':
                    items.sort((a, b) => b.createdAt - a.createdAt);
                    break;

                case 'priceUp':
                    items.sort((a, b) => a.dataValues.minPrice - b.dataValues.minPrice);
                    break;

                case 'priceDown':
                    items.sort((a, b) => b.dataValues.minPrice - a.dataValues.minPrice);
                    break;

                case 'popular':
                    items.sort((a, b) => b.orders - a.orders);
                    break;

                default:
                    break;
            }

            const paginatedItems = items.slice(offset, offset + limitClient)

            items = {
                count: items.length,
                rows: paginatedItems
            }

            return res.json(items)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getByIds(req, res, next) {
        try {
            const { id_arr } = req.query
            let ids = JSON.parse(id_arr)
            let items = await Item.findAll({ where: { id: { [Op.in]: ids } } })
            for (let i = 0; i < items.length; i++) {
                const img = await Photo.findOne({ where: { item_uid: items[i].dataValues.item_uid } })
                items[i].dataValues.img = img.dataValues.img
                const prices = await Size.findAll({ where: { item_uid: items[i].dataValues.item_uid } })
                let minPrice = 1000000000
                for (let j = 0; j < prices.length; j++) {
                    if (prices[j].dataValues.price < minPrice) {
                        minPrice = prices[j].dataValues.price
                    }
                }
                items[i].dataValues.minPrice = minPrice
            }
            return res.json(items)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getCartItems(req, res, next) {
        try {
            const { items_arr } = req.query
            let items = JSON.parse(items_arr)
            let newItems = []
            if (Array.isArray(items)) {
                for (let i of items) {
                    let item = await Item.findOne({ where: { item_uid: i.item_uid } })
                    if (item) {
                        const img = await Photo.findOne({ where: { item_uid: item.dataValues.item_uid } })
                        item.dataValues.img = img.dataValues.img
                        item.dataValues.size = i.size
                        item.dataValues.ship = i.ship
                        newItems.push(item)
                    }
                }
                for (let i = 0; i < newItems.length; i++) {
                    const price = await Size.findOne({ where: { item_uid: newItems[i].dataValues.item_uid, size: newItems[i].dataValues.size } })
                    newItems[i].dataValues.price = price.dataValues.price
                }
            }
            return res.json(newItems)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getBrandsAndModels(req, res, next) {
        try {
            const { category } = req.query
            let brands = await Item.findAll({ attributes: ['brand'], group: ['brand'], where: { ...(category && { category }) } })
            for (let i = 0; i < brands.length; i++) {
                const models = await Item.findAll({ attributes: ['model'], group: ['model'], where: { brand: brands[i].dataValues.brand, ...(category && { category }) } })
                brands[i].dataValues.models = models
                for (let j of brands[i].dataValues.models) {
                    j.brand = brands[i].brand
                }
            }
            return res.json(brands)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new ItemController()