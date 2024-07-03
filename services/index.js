const axios = require('axios')

const $cdekHost = axios.create({
    baseURL: process.env.CDEK_URL,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

const $authCdekHost = axios.create({
    baseURL: process.env.CDEK_URL,
})

const $authPoizonHost = axios.create({
    baseURL: process.env.POIZON_URL
})

const cdekInterceptor = async config => {
    await getToken().then(token => {
        config.headers.authorization = `Bearer ${token}`
        return config
    })
    return config
}

$authCdekHost.interceptors.request.use(cdekInterceptor)

const poizonInterceptor = async config => {
    config.headers.apiKey = process.env.POIZON_API_KEY
    return config
}

$authPoizonHost.interceptors.request.use(poizonInterceptor)

const getToken = async () => {
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', process.env.CLIENT_ID)
    params.append('client_secret', process.env.CLIENT_SECRET)

    const { data } = await $cdekHost.post('oauth/token', params)
    return data.access_token
}

module.exports = { $authCdekHost, $authPoizonHost }