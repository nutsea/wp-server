const { $authPoizonHost, $poizonHost } = require('./index')

const getPoizonItem = async (spuId, timeElapsed) => {
    try {
        if (timeElapsed) {
            const { data } = await $authPoizonHost.get('productDetailWithPrice', { params: { spuId: spuId.toString(), timeElapsed: Number(timeElapsed) }, headers: { timeElapsed } })
            return data
        } else {
            const { data } = await $authPoizonHost.get('productDetailWithPrice', { params: { spuId: spuId.toString() } })
            return data
        }
    } catch (e) {
        console.log(e)
        return e
    }
}

const getPoizonIds = async (keyword, limit, page, timeElapsed) => {
    try {
        if (timeElapsed) {
            const { data } = await $authPoizonHost.get('searchProducts', { params: { keyword, limit, page }, headers: { timeElapsed } })
            return data
        } else {
            const { data } = await $authPoizonHost.get('searchProducts', { params: { keyword, limit, page } })
            return data
        }
    } catch (e) {
        console.log(e)
        return e
    }
}

const getByLink = async (link) => {
    try {
        const { data } = await $authPoizonHost.get('/convertLinkToSpuId', { params: { link } })
        return data
    } catch (e) {
        console.log(e)
        return e
    }
}

module.exports = { getPoizonItem, getPoizonIds, getByLink }