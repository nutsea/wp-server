const { $authCdekHost } = require('./index')

const getCityList = async () => {
    const { data } = await $authCdekHost.get('location/cities')
    return data
}

const getPointsList = async (type, country_code) => {
    const { data } = await $authCdekHost.get(`deliverypoints`, { params: { type, country_code } })
    return data
}

module.exports = { getCityList, getPointsList }