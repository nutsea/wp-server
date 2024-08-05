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
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        message: err.message || 'Произошла ошибка'
    })
})

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

        const course = await models.Constants.findOne({ where: { name: 'course' } })
        if (!course) {
            await models.Constants.create({ name: 'course', value: 15 })
        }

        const standartShip = await models.Constants.findOne({ where: { name: 'standartShip' } })
        if (!standartShip) {
            await models.Constants.create({ name: 'standartShip', value: 2000 })
        }

        const expressShip = await models.Constants.findOne({ where: { name: 'expressShip' } })
        if (!expressShip) {
            await models.Constants.create({ name: 'expressShip', value: 3500 })
        }

        const fee = await models.Constants.findOne({ where: { name: 'fee' } })
        if (!fee) {
            await models.Constants.create({ name: 'fee', value: 1000 })
        }
    } catch (e) {
        console.log(e)
    }
}

start()

// telegram bot
const { Telegraf, Markup } = require('telegraf')

const token = process.env.BOT_TOKEN

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
    // ctx.reply(`Вы прошли авторизацию! Для продолжения перейдите по ссылке http://192.168.0.162:3000/?authcode=${auth.code}`)

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
        const link = ctx.message.from.username

        let user = await models.User.findOne({ where: { phone } })
        if (!user) {
            console.log('user not found')
            user = await models.User.create({ name, surname, phone, chat_id: chat_id.toString(), link })
        } else {
            user.link = link
            await user.save()
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
    let user = await models.User.findOne({ where: { chat_id: chat_id.toString() } })
    let auth = await models.Auth.findOne({ where: { chat_id: chat_id.toString() } })
    if (auth) {
        if (user) {
            checkAuth(auth, user.phone, ctx)
            user.link = ctx.message.from.username
            await user.save()
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
            const newAuth = await models.Auth.create({ code: authCode, chat_id: chat_id.toString() })
            if (user) {
                checkAuth(newAuth, user.phone, ctx)
                user.link = ctx.message.from.username
                await user.save()
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

async function sendMessageToUser(userId, message) {
    try {
        await bot.telegram.sendMessage(userId, message);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

module.exports = {
    sendMessageToUser,
}

console.log('Бот запущен')

cron.schedule('0 0 * * *', setPointsList, {
    timezone: "Europe/Moscow"
})