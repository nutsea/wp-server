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
            for (let i of spuIdArr) {
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
            }
            return res.json(items)
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
                    try {
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
                                        const size = await Size.create({ size: k.sizeValue[j], price: data.skus[j].price.prices[0].price, item_uid: i.toString(), size_type: k.sizeKey, size_default: list[0].sizeValue[j], item_category: category })
                                        sizes.push(size)
                                    }
                                    else {
                                        isSize.price = data.skus[j].price.prices[0].price
                                        await isSize.save()
                                        sizes.push(isSize)
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
            console.log(ids)
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
                    let item = await Item.findOne({ where: { id: i.id } })
                    const img = await Photo.findOne({ where: { item_uid: item.dataValues.item_uid } })
                    item.dataValues.img = img.dataValues.img
                    newItems.push(item)
                }
                for (let i = 0; i < newItems.length; i++) {
                    const price = await Size.findOne({ where: { item_uid: newItems[i].dataValues.item_uid, size: items[i].size } })
                    newItems[i].dataValues.price = price.dataValues.price
                    newItems[i].dataValues.size = items[i].size
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

    // async getAll(req, res, next) {
    //     try {
    //         let { category, brands, models, colors, sizes_eu, sizes_ru, sizes_us, sizes_uk, sizes_sm, sizes_clo, priceMin, priceMax, sort, limit, page, in_stock, isModelsSet, isShoesSet, isClothesSet, search, sale, subcats } = req.query
    //         let categoriesArr = []
    //         if (category === undefined || category === 'all') {
    //             categoriesArr = ['shoes', 'clothes', 'accessories']
    //         } else {
    //             categoriesArr.push(category)
    //         }
    //         let count
    //         if (in_stock == 'true') count = { [Op.gt]: 0 }
    //         else count = { [Op.gte]: 0 }
    //         let order = []
    //         if (sort === 'priceup') {
    //             order.push(['price', 'ASC'])
    //         } else if (sort === 'pricedown') {
    //             order.push(['price', 'DESC'])
    //         } else if (sort === 'newup') {
    //             order.push(['createdAt', 'ASC'])
    //         } else if (sort === 'newdown') {
    //             order.push(['createdAt', 'DESC'])
    //         } else {
    //             order.push(['name', 'ASC'])
    //         }
    //         let subcatsNum = null
    //         if (Array.isArray(subcats)) subcatsNum = subcats.map(item => item.toString())
    //         if (subcatsNum && subcatsNum.length === 0) subcatsNum = null
    //         if (subcatsNum.includes('1')) subcatsNum = null
    //         page = page || 1
    //         limit = limit || 18
    //         let offset = page * limit - limit
    //         let searchWord = search && search !== 'all' ? search.toLowerCase() : ''
    //         const items = await Item.findAndCountAll({
    //             attributes: [
    //                 'code',
    //                 [Sequelize.fn('array_agg', Sequelize.col('count')), 'counts'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('brand')), 'brand'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('model')), 'model'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('color')), 'color'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_eu')), 'size_eu'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_ru')), 'size_ru'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_us')), 'size_us'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_uk')), 'size_uk'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_sm')), 'size_sm'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('size_clo')), 'size_clo'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('price')), 'price'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('sale')), 'sale'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('category')), 'category'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('img')), 'img'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('name')), 'name'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('description')), 'description'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('id')), 'id'],
    //                 [Sequelize.fn('array_agg', Sequelize.col('createdAt')), 'createdAt']
    //             ],
    //             where: {
    //                 [Op.and]: [
    //                     {
    //                         [Op.or]: [
    //                             {
    //                                 code: { [Op.iLike]: `%${searchWord}%` }
    //                             },
    //                             {
    //                                 name: { [Op.iLike]: `%${searchWord}%` }
    //                             },
    //                             {
    //                                 brand: { [Op.iLike]: `%${searchWord}%` }
    //                             },
    //                             {
    //                                 description: { [Op.iLike]: `%${searchWord}%` }
    //                             },
    //                             {
    //                                 tags: { [Op.iLike]: `%${searchWord}%` }
    //                             }
    //                         ]
    //                     },
    //                     {
    //                         brand: { [Op.in]: brands.map(item => item.brand) },
    //                         price: {
    //                             [Op.and]: [
    //                                 { [Op.gt]: Number(priceMin) - 1 },
    //                                 { [Op.lt]: Number(priceMax) + 1 }
    //                             ]
    //                         },
    //                         ...(isShoesSet === 'true' && sizes_eu && {
    //                             size_eu: { [Op.in]: sizes_eu.map(item => item.size_eu) },
    //                         }),
    //                         ...(isShoesSet === 'true' && sizes_ru && {
    //                             size_ru: { [Op.in]: sizes_ru.map(item => item.size_ru) },
    //                         }),
    //                         ...(isShoesSet === 'true' && sizes_us && {
    //                             size_us: { [Op.in]: sizes_us.map(item => item.size_us) },
    //                         }),
    //                         ...(isShoesSet === 'true' && sizes_uk && {
    //                             size_uk: { [Op.in]: sizes_uk.map(item => item.size_uk) },
    //                         }),
    //                         ...(isShoesSet === 'true' && sizes_sm && {
    //                             size_sm: { [Op.in]: sizes_sm.map(item => item.size_sm) },
    //                         }),
    //                         ...(isClothesSet === 'true' && sizes_clo && {
    //                             size_clo: { [Op.in]: sizes_clo.map(item => item.size_clo) },
    //                         }),
    //                         ...(isModelsSet === 'true' && {
    //                             model: { [Op.in]: models.map(item => item.model) },
    //                         }),
    //                         category: { [Op.in]: categoriesArr },
    //                         [Op.or]: [
    //                             {
    //                                 category: 'shoes',
    //                             },
    //                             {
    //                                 category: 'clothes',
    //                             },
    //                             {
    //                                 category: 'accessories'
    //                             },
    //                             {
    //                                 category: 'all',
    //                             }
    //                         ],
    //                         color: {
    //                             [Op.or]: colors.map(i => ({
    //                                 [Op.like]: `%${i.color}%`
    //                             }))
    //                         },
    //                         count: count,
    //                         ...(sale === 'sale' && {
    //                             sale: { [Op.not]: null },
    //                             sale: { [Op.not]: 0 }
    //                         }),
    //                         ...(subcatsNum && {
    //                             sub_category: { [Op.in]: subcatsNum }
    //                         })
    //                     }
    //                 ]
    //             },
    //             order: order,
    //             group: ['code', 'name'],
    //             limit,
    //             offset
    //         })
    //         let newItems = {
    //             count: items.count.length,
    //             rows: items.rows
    //         }
    //         return res.json(newItems)
    //     } catch (e) {
    //         return next(ApiError.badRequest(e.message))
    //     }
    // }
}

module.exports = new ItemController()