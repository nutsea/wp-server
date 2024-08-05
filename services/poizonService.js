const { $authPoizonHost } = require('./index')

const getPoizonItem = async (spuId) => {
    try {
        const { data } = await $authPoizonHost.get('productDetailWithPrice', { params: { spuId: spuId.toString() } })
        return data
    } catch (e) {
        console.log(e)
        return e
    }
}

const getPoizonIds = async (keyword, limit, page) => {
    try {
        const { data } = await $authPoizonHost.get('searchProducts', { params: { keyword, limit, page } })
        return data
    } catch (e) {
        console.log(e)
        return e
    }
}

module.exports = { getPoizonItem, getPoizonIds }