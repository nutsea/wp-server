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
const { v4: uuidv4 } = require('uuid')
const cron = require('node-cron')
const { setPointsList } = require('./controllers/CdekController')

const PORT = process.env.PORT || 5000

// for linux
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/wearpoizon.workinit.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/wearpoizon.workinit.ru/cert.pem')
}

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'static')))
app.use(fileUpload({}))
app.use('/api', router)

// for linux
const server = https.createServer(options, app)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()

        // not for linux
        // app.listen(PORT, () => console.log(`Server started on port ${PORT}`))

        // for linux
        server.listen(PORT, () => console.log(`Server started on port ${PORT}`))

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
    ctx.reply('Нажмите кнопку ниже, чтобы авторизоваться.',
        Markup.keyboard([
            ['Авторизоваться']
        ]).resize()
    );
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

const checkAuth = async (auth, phone, ctx) => {
    auth.status = 'authentificated'
    auth.phone = phone
    await auth.save()

    // not for linux
    // ctx.reply(`Вы прошли авторизацию! Для продолжения перейдите по ссылке http://localhost:3000/?authcode=${auth.code}`)

    // for linux
    ctx.reply('Вы прошли авторизацию! Для продолжения перейдите на сайт по ссылке ниже:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Перейти на сайт', url: `https://wearpoizon.netlify.app/?authcode=${auth.code}` }
                ]
            ]
        }
    })
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
            user = await models.User.create({ name, surname, phone, chat_id })
        }

        let auth = await models.Auth.findOne({ where: { chat_id: chat_id.toString() } })
        if (auth) {
            checkAuth(auth, phone, ctx)
        }
    } catch (e) {
        console.log(e)
    }
})

bot.hears('Авторизоваться', async (ctx) => {
    const chat_id = ctx.chat.id
    let user = await models.User.findOne({ where: { chat_id } })
    let auth = await models.Auth.findOne({ where: { chat_id: chat_id.toString() } })
    if (auth) {
        if (user) {
            checkAuth(auth, user.phone, ctx)
        } else {
            ctx.reply('Нажмите кнопку ниже, чтобы отправить номер телефона.',
                Markup.keyboard([
                    [Markup.button.contactRequest('Отправить номер телефона')],
                    ['Отмена']
                ]).resize()
            );
        }
    } else {
        try {
            const authCode = uuidv4()
            await models.Auth.create({ code: authCode, chat_id: chat_id.toString() })
            if (user) {
                checkAuth(auth, user.phone, ctx)
            } else {
                ctx.reply('Нажмите кнопку ниже, чтобы отправить номер телефона.',
                    Markup.keyboard([
                        [Markup.button.contactRequest('Отправить номер телефона')],
                        ['Отмена']
                    ]).resize()
                );
            }
        } catch (e) {
            console.log(e)
        }
    }
});

bot.hears('Отмена', (ctx) => {
    ctx.reply('Вы отменили авторизацию.',
        Markup.keyboard([
            ['Авторизоваться']
        ]).resize()
    )
})

bot.launch()

console.log('Бот запущен')

cron.schedule('0 0 * * *', setPointsList, {
    timezone: "Europe/Moscow"
})