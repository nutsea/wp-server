const { Item, Photo, Size, Fav, Cart } = require('../models/models')
const ApiError = require('../error/apiError')
const { Op } = require('sequelize')
const { getPoizonItem, getPoizonIds } = require('../services/poizonService')

function filterString(str) {
    const regex = /[^a-zA-Zа-яА-Я0-9 ]/g
    return str.replace(regex, '')
}

function translateToSM(str) {
    if (str === "适合脚长") return "SM"
}

function convertStringToArray(sizesString) {
    const sizesArray = sizesString.split(',').map(item => item.trim())
    return sizesArray
}

const isUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
}

function formatSkus(skus) {
    const price = skus.price.prices
    let price_0, price_2, price_3, delivery_0, delivery_2, delivery_3
    const tradeType_0 = price.find(item => item.tradeType === 0)
    if (tradeType_0 && ((tradeType_0 && !tradeType_0.channelAdditionInfoDTO) || (tradeType_0 && !tradeType_0.channelAdditionInfoDTO.symbol))) {
        price_0 = tradeType_0.price
        delivery_0 = tradeType_0.timeDelivery.min.toString() + '-' + tradeType_0.timeDelivery.max.toString()
    }
    const tradeType_2 = price.find(item => item.tradeType === 2)
    if (tradeType_2 && ((tradeType_2 && !tradeType_2.channelAdditionInfoDTO) || (tradeType_2 && !tradeType_2.channelAdditionInfoDTO.symbol))) {
        price_2 = price.find(item => item.tradeType === 2).price
        delivery_2 = tradeType_2.timeDelivery.min.toString() + '-' + tradeType_2.timeDelivery.max.toString()
    }
    const tradeType_3 = price.find(item => item.tradeType === 3)
    if (tradeType_3 && ((tradeType_3 && !tradeType_3.channelAdditionInfoDTO) || (tradeType_3 && !tradeType_3.channelAdditionInfoDTO.symbol))) {
        price_3 = price.find(item => item.tradeType === 3).price
        delivery_3 = tradeType_3.timeDelivery.min.toString() + '-' + tradeType_3.timeDelivery.max.toString()
    }
    let clientPrice = null
    let timeDelivery = null
    if (price_0) {
        clientPrice = price_0
        timeDelivery = tradeType_0.timeDelivery.max
    } else if (price_2) {
        clientPrice = price_2
        timeDelivery = tradeType_2.timeDelivery.max
    } else if (price_3) {
        clientPrice = price_3
        timeDelivery = tradeType_3.timeDelivery.max
    }

    if (price_0 && (clientPrice - price_0) <= 2000 && tradeType_0.timeDelivery.max <= timeDelivery) {
        clientPrice = price_0
        timeDelivery = tradeType_0.timeDelivery.max
    }
    if (
        price_2 &&
        (clientPrice < price_2 && (price_2 - clientPrice) <= 2000 && tradeType_2.timeDelivery.max <= timeDelivery) ||
        (clientPrice > price_2 && (clientPrice - price_2) >= 2000)
    ) {
        clientPrice = price_2
        timeDelivery = tradeType_2.timeDelivery.max
    }
    if (
        price_3 &&
        (clientPrice < price_3 && (price_3 - clientPrice) <= 2000 && tradeType_3.timeDelivery.max <= timeDelivery) ||
        (clientPrice > price_3 && (clientPrice - price_3) >= 2000)
    ) {
        clientPrice = price_3
    }
    return { clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3 }
}

class ItemController {
    async create(req, res, next) {
        try {
            const { name, item_uid, category, brand, model, orders } = req.body
            const item = await Item.create({ name, item_uid, category, brand, model, orders })
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async createBySpuId(req, res, next) {
        try {
            const { spuIdArr, category, timeElapsed } = req.body
            console.log(spuIdArr, category, timeElapsed)
            let items = []
            let error = false
            for (let i of spuIdArr) {
                try {
                    await getPoizonItem(i, timeElapsed).then(async data => {
                        console.log(data)
                        try {
                            const isItem = await Item.findOne({ where: { item_uid: i.toString() } })
                            if (!isItem) {
                                const item = await Item.create({ name: filterString(data.detail.structureTitle), item_uid: i.toString(), category, brand: filterString(data.brandRootInfo.brandItemList[0].brandName), model: filterString(data.detail.structureTitle), orders: 0 })
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
                                if (data.skus[j] && data.skus[j].properties[0] && data.skus[j].properties[0].saleProperty && data.skus[j].properties[0].saleProperty.value) {
                                    const { clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3 } = formatSkus(data.skus[j])
                                    const defaultSize = data.skus[j].properties[0].saleProperty.value
                                    console.log(defaultSize)
                                    const sameSizes = await Size.findAll({ where: { size_default: defaultSize, item_uid: i.toString() } })
                                    if (sameSizes && sameSizes.length > 0) {
                                        for (let k of sameSizes) {
                                            if (clientPrice) {
                                                k.price = clientPrice
                                                k.price_0 = price_0
                                                k.price_2 = price_2
                                                k.price_3 = price_3
                                                k.delivery_0 = delivery_0
                                                k.delivery_2 = delivery_2
                                                k.delivery_3 = delivery_3
                                                await k.save()
                                            } else {
                                                await k.destroy()
                                            }
                                        }
                                    } else {
                                        if (clientPrice) {
                                            await Size.create({ size: defaultSize, price: clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3, item_uid: i.toString(), size_type: list[0].sizeKey, size_default: defaultSize, item_category: category })
                                            const defaultTemplate = list[0].sizeValue
                                            const defaultIndex = defaultTemplate.findIndex(item => item === defaultSize)
                                            for (let k of list) {
                                                if (k.sizeValue[defaultIndex] && k.sizeValue[defaultIndex] !== defaultSize) {
                                                    await Size.create({ size: k.sizeValue[defaultIndex], price: clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3, item_uid: i.toString(), size_type: k.sizeKey, size_default: defaultSize, item_category: category })
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // console.log(e)
                        }
                    })
                } catch (e) {
                    // console.log(e)
                    error = true
                }
            }
            return res.json({ items, error })
        } catch (e) {
            // console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getSpuIds(req, res, next) {
        try {
            const { keyword, limit, page } = req.query
            let ids = await getPoizonIds(keyword, limit, page)
            return res.json(ids)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async checkCost(req, res, next) {
        try {
            const { spuIdArr, timeElapsed } = req.query
            let ids = JSON.parse(spuIdArr)
            let sizes = []
            for (let i of ids) {
                await getPoizonItem(i, timeElapsed).then(async data => {
                    let list = data.sizeDto.sizeInfo.sizeTemplate.list
                    for (let j of list) {
                        if (j.sizeKey === '适合脚长') j.sizeKey = 'SM'
                        j.sizeKey = filterString(j.sizeKey)
                        j.sizeValue = convertStringToArray(j.sizeValue)
                    }
                    for (let j = 0; j < data.skus.length; j++) {
                        if (data.skus[j] && data.skus[j].properties[0] && data.skus[j].properties[0].saleProperty && data.skus[j].properties[0].saleProperty.value) {
                            const { clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3 } = formatSkus(data.skus[j])
                            const defaultSize = data.skus[j].properties[0].saleProperty.value
                            console.log(defaultSize)
                            const sameSizes = await Size.findAll({ where: { size_default: defaultSize, item_uid: i.toString() } })
                            if (sameSizes && sameSizes.length > 0) {
                                for (let k of sameSizes) {
                                    if (clientPrice) {
                                        k.price = clientPrice
                                        k.price_0 = price_0
                                        k.price_2 = price_2
                                        k.price_3 = price_3
                                        k.delivery_0 = delivery_0
                                        k.delivery_2 = delivery_2
                                        k.delivery_3 = delivery_3
                                        await k.save()
                                    } else {
                                        await k.destroy()
                                    }
                                }
                            } else {
                                if (clientPrice) {
                                    await Size.create({ size: defaultSize, price: clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3, item_uid: i.toString(), size_type: list[0].sizeKey, size_default: defaultSize, item_category: category })
                                    const defaultTemplate = list[0].sizeValue
                                    const defaultIndex = defaultTemplate.findIndex(item => item === defaultSize)
                                    for (let k of list) {
                                        if (k.sizeValue[defaultIndex] && k.sizeValue[defaultIndex] !== defaultSize) {
                                            await Size.create({ size: k.sizeValue[defaultIndex], price: clientPrice, price_0, price_2, price_3, delivery_0, delivery_2, delivery_3, item_uid: i.toString(), size_type: k.sizeKey, size_default: defaultSize, item_category: category })
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            }
            return res.json(sizes)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const { id } = req.query
            let item = await Item.findOne({ where: { id } })
            const images = await Photo.findAll({ where: { item_uid: item.dataValues.item_uid } })
            item.dataValues.img = images
            let sizes = await Size.findAll({ where: { item_uid: item.dataValues.item_uid } })
            for (let i of sizes) {
                const orders = await Cart.findAll({ where: { item_uid: item.dataValues.item_uid, size: i.dataValues.size_default } })
                i.dataValues.orders = orders.length
            }
            item.dataValues.sizes = sizes
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getOneBySpu(req, res, next) {
        try {
            const { spu } = req.query
            let item = await Item.findOne({ where: { item_uid: spu } })
            if (!item) return res.json({ message: 'Item not found' })
            const images = await Photo.findAll({ where: { item_uid: item.dataValues.item_uid } })
            item.dataValues.img = images
            let sizes = await Size.findAll({ where: { item_uid: item.dataValues.item_uid } })
            item.dataValues.sizes = sizes
            return res.json(item)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getPopular(req, res, next) {
        try {
            let items = await Item.findAll()
            let pageClient = 1
            let limitClient = 10
            let offset = Number(pageClient) * Number(limitClient) - Number(limitClient)

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
                let maxPrice = 0
                for (let j = 0; j < prices.length; j++) {
                    if (prices[j].dataValues.price > maxPrice) {
                        maxPrice = prices[j].dataValues.price
                    }
                }
                items[i].dataValues.maxPrice = maxPrice
            }

            items.sort((a, b) => b.orders - a.orders)

            const paginatedItems = items.slice(offset, offset + limitClient)

            for (let i of items) {
                const fav = await Fav.findAll({ where: { item_uid: i.dataValues.id } })
                const cart = await Cart.findAll({ where: { item_uid: i.dataValues.item_uid } })
                i.dataValues.fav = fav.length
                i.dataValues.cart = cart.length
            }

            items = {
                count: items.length,
                rows: paginatedItems
            }

            return res.json(items)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const { category, brands, models, sizes, size_type, prices, sort, limit, page, search } = req.query
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
                    ...(brands && conditions),
                    ...(search && {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                            { brand: { [Op.iLike]: `%${search}%` } },
                            { model: { [Op.iLike]: `%${search}%` } },
                            { item_uid: { [Op.iLike]: `%${search}%` } },
                        ]
                    })
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
                let maxPrice = 0
                for (let j = 0; j < prices.length; j++) {
                    if (prices[j].dataValues.price > maxPrice) {
                        maxPrice = prices[j].dataValues.price
                    }
                }
                items[i].dataValues.maxPrice = maxPrice
            }

            switch (sort) {
                case 'new':
                    items.sort((a, b) => b.createdAt - a.createdAt);
                    break;

                case 'old':
                    items.sort((a, b) => a.createdAt - b.createdAt);
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

            for (let i of items) {
                const fav = await Fav.findAll({ where: { item_uid: i.dataValues.id } })
                const cart = await Cart.findAll({ where: { item_uid: i.dataValues.item_uid } })
                i.dataValues.fav = fav.length
                i.dataValues.cart = cart.length
            }

            items = {
                count: items.length,
                rows: paginatedItems
            }

            return res.json(items)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getByIds(req, res, next) {
        try {
            const { id_arr } = req.query
            let ids = JSON.parse(id_arr)
            ids = ids.filter(id => isUUID(id))
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
            console.log(e)
            return next(ApiError.badRequest(e.message))
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
                        const price = await Size.findOne({ where: { item_uid: item.dataValues.item_uid, size: item.dataValues.size } })
                        if (price) {
                            newItems.push(item)
                        }
                    }
                }
                for (let i = 0; i < newItems.length; i++) {
                    const price = await Size.findOne({ where: { item_uid: newItems[i].dataValues.item_uid, size: newItems[i].dataValues.size } })
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
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const { idArr } = req.query
            for (let id of idArr) {
                const item = await Item.findOne({ where: { item_uid: id } })
                const photos = await Photo.findAll({ where: { item_uid: item.dataValues.item_uid } })
                const sizes = await Size.findAll({ where: { item_uid: item.dataValues.item_uid } })
                await item.destroy()
                for (let i of photos) {
                    await i.destroy()
                }
                for (let i of sizes) {
                    await i.destroy()
                }
            }
            return res.json({ message: 'Items deleted' })
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new ItemController()