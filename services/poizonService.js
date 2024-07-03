const { $authPoizonHost } = require('./index')

const getPoizonItem = async (spuId) => {
    try {
        const { data } = await $authPoizonHost.get('productDetailWithPrice', { params: { spuId: spuId.toString() } })
        return data
    } catch (e) {
        console.log(e)
    }
}

module.exports = { getPoizonItem }