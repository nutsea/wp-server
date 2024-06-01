require('dotenv').config()
const express = require('express')
const sequelize = require('./db')
const models = require('./models/models')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const router = require('./routes/index')
const path = require('path')
const https = require('https')
const fs = require('fs')

const PORT = process.env.PORT || 5000

// for linux

// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/server.hockeystickstop.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/server.hockeystickstop.com/cert.pem')
// }

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'static')))
app.use(fileUpload({}))
app.use('/api', router)

// for linux

// const server = https.createServer(options, app)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
        // for linux
        // server.listen(PORT, () => console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()

// telegram bot
const { Telegraf, Markup } = require('telegraf')
const token = '7117696688:AAGBCpe3nQEziMRibTakCm6UjDkUgG7shVs'
const bot = new Telegraf(token)

bot.start(async (ctx) => {
    try {
        const text = ctx.message.text
        console.log(text)
        const code = text.split(' ')[1]
        if (code) {
            let auth = await models.Auth.findOne({ where: { code } })
            auth.chat_id = ctx.chat.id
            await auth.save()
            ctx.reply('Нажмите кнопку ниже, чтобы авторизоваться.',
                Markup.keyboard([
                    Markup.button.contactRequest('Отправить номер телефона')
                ]).resize()
            )
        } else {
            ctx.reply('Для авторизации перейдите на сайт и нажмите "Вход" или "Авторизация через Telegram"')
        }
    } catch (e) {
        console.log(e)
    }
})

const normalizePhoneNumber = (phoneNumber) => {
    if (phoneNumber.startsWith('+7')) {
        return phoneNumber.replace('+7', '7')
    } else if (phoneNumber.startsWith('8')) {
        return phoneNumber.replace('8', '7')
    } else if (phoneNumber.startsWith('7')) {
        return phoneNumber
    } else {
        return phoneNumber
    }
}

bot.on('contact', async (ctx) => {
    try {
        const contact = ctx.message.contact
        const chat_id = ctx.chat.id
        const phone = normalizePhoneNumber(contact.phone_number)
        const name = contact.first_name ? contact.first_name : contact.username
        const surname = contact.last_name || ''
    
        let user = await models.User.findOne({ where: { phone } })
        if (!user) {
            user = await models.User.create({ name, surname, phone })
        }
    
        let auth = await models.Auth.findOne({ where: { chat_id: chat_id.toString() } })
        if (auth) {
            auth.status = 'authentificated'
            auth.phone = phone
            await auth.save()
            ctx.reply(`Вы прошли авторизацию! Для продолжения вернитесь на сайт.`)
        }
    } catch (e) {
        console.log(e)
    }
})

bot.launch()

console.log('Бот запущен')