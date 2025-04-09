const sharp = require('sharp')
const axios = require('axios')

const filterString = (str) => {
    const regex = /[^a-zA-Zа-яА-Я0-9 \x00-\x7F]/g
    return str.replace(regex, '')
}

const filterSize = (str) => {
    const regex = /[^a-zA-Zа-яА-Я0-9 \u2150-\u215F\x00-\x7F.]/g
    return str.replace(regex, '')
}

const translateToSM = (str) => {
    if (str === "适合脚长") return "SM"
}

const convertStringToArray = (sizesString) => {
    const sizesArray = sizesString.split(',').map(item => item.trim())
    return sizesArray
}

const isUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
}

const formatSkus = (skus) => {
    const price = skus.price.prices
    let price_0, price_2, price_3, price_12, delivery_0, delivery_2, delivery_3, delivery_12
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
    const tradeType_12 = price.find(item => item.tradeType === 12)
    if (tradeType_12 && ((tradeType_12 && !tradeType_12.channelAdditionInfoDTO) || (tradeType_12 && !tradeType_12.channelAdditionInfoDTO.symbol))) {
        price_12 = price.find(item => item.tradeType === 12).price
        delivery_12 = tradeType_12.timeDelivery.min.toString() + '-' + tradeType_12.timeDelivery.max.toString()
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
    } else if (price_12) {
        clientPrice = price_12
        timeDelivery = tradeType_12.timeDelivery.max
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
        timeDelivery = tradeType_3.timeDelivery.max
    }
    if (
        price_12 &&
        (clientPrice < price_12 && (price_12 - clientPrice) <= 2000 && tradeType_12.timeDelivery.max <= timeDelivery) ||
        (clientPrice > price_12 && (clientPrice - price_12) >= 2000)
    ) {
        clientPrice = price_12
    }
    return { clientPrice, price_0, price_2, price_3, price_12, delivery_0, delivery_2, delivery_3, delivery_12 }
}

const validProperty = (data) => {
    if (data && data.properties && data.properties[0] && data.properties[0].saleProperty && data.properties[0].saleProperty.value) {
        for (let i of data.properties) {
            if (i.saleProperty && filterSize(i.saleProperty.value) === i.saleProperty.value) {
                return i.saleProperty.value
            }
        }
    }
    return null
}

const replaceValid = value => value
    .replace('½', ' 1/2')
    .replace('⅔', ' 2/3')
    .replace('⅓', ' 1/3')
    .replace('¼', ' 1/4')
    .replace('¾', ' 3/4')
    .replace('6XS', 'XXXXXXS')
    .replace('5XS', 'XXXXXS')
    .replace('4XS', 'XXXXS')
    .replace('3XS', 'XXXS')
    .replace('2XS', 'XXS')
    .replace('2XL', 'XXL')
    .replace('3XL', 'XXXL')
    .replace('4XL', 'XXXXL')
    .replace('5XL', 'XXXXXL')
    .replace('6XL', 'XXXXXXL')
    .replace(/\d+\/(XXXXS|XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|XXXXL)/g, (_, size) => size)

const convertSizeToNumeric = (size) => {
    size = size.replace(' 1/3', '.33').replace(' 2/3', '.67').replace(' 1/2', '.5').replace(' 1/4', '.25').replace(' 3/4', '.75')
    return parseFloat(size)
}

const isValidSize = (size) => {
    return /^(\d+(\.\d+)?(\/\d+)?(\s\d\/\d)?)$/.test(size)
}

const sortItemsBySize = (items) => {
    const sizeOrder = ["xxxxs", "xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl"]

    const getNumericValue = (size) => {
        return convertSizeToNumeric(size)
    }

    const getSizeOrder = (size) => {
        return sizeOrder.indexOf(size.toLowerCase())
    }

    const isInSizeOrder = (size) => {
        return sizeOrder.includes(size.toLowerCase())
    }

    let numericItems = items.filter(item => isValidSize(item.size))
    let validLetterItems = items.filter(item => !isValidSize(item.size) && isInSizeOrder(item.size))
    const invalidLetterItems = items.filter(item => !isValidSize(item.size) && !isInSizeOrder(item.size))

    numericItems = numericItems.sort((a, b) => getNumericValue(a.size) - getNumericValue(b.size))

    validLetterItems = validLetterItems.sort((a, b) => getSizeOrder(a.size) - getSizeOrder(b.size))

    return numericItems.concat(validLetterItems).concat(invalidLetterItems)
}

const getFirstPixelColor = async (imageUrl) => {
    try {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const { data } = await sharp(response.data)
            .ensureAlpha()
            .extract({ left: 0, top: 0, width: 1, height: 1 })
            .raw()
            .toBuffer({ resolveWithObject: true })
        const [r, g, b, a] = data
        // return a === 0 ? "transparent" : `rgb(${r}, ${g}, ${b})`
        return a === 0 ? { r: 0, g: 0, b: 0, a: 0 } : { r, g, b, a: 1 }
    } catch (error) {
        console.error("Ошибка обработки изображения:", error)
        return next(ApiError.badRequest(error.message))
    }
}

const isNumericString = (str) => {
    // return /^[0-9]+$/.test(str)
    return /^[A-Za-z]+\/[A-Za-z]+(\/[A-Za-z]+)*$/.test(str)
}

const allNumericSizes = (arr) => {
    let check = true
    for (let i of arr) {
        if (!isNumericString(validProperty(i))) check = false
    }
    return check
}

module.exports = {
    filterString,
    filterSize,
    translateToSM,
    convertStringToArray,
    isUUID,
    formatSkus,
    validProperty,
    replaceValid,
    convertSizeToNumeric,
    isValidSize,
    sortItemsBySize,
    getFirstPixelColor,
    isNumericString,
    allNumericSizes
}