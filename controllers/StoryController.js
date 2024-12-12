const { Story } = require('../models/models')
const ApiError = require('../error/apiError')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

class StoryController {
    async create(req, res, next) {
        try {
            const { type } = req.body
            const { img } = req.files
            let fileName = uuidv4() + ".jpg"
            const outputPath = path.resolve(__dirname, '..', 'static', fileName)

            await sharp(img.data)
                .toFormat('jpeg', { quality: 100 })
                .toFile(outputPath)

            const story = await Story.create({ img: fileName, type })
            return res.json(story)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const { type } = req.query
            const stories = await Story.findAll({ where: { type } })
            return res.json(stories)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new StoryController()