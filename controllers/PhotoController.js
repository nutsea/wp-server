const { Photo } = require('../models/models')
const ApiError = require('../error/apiError')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

class PhotoController {
    async create(req, res, next) {
        try {
            const { item_uid } = req.body
            const { img } = req.files
            let fileName = uuidv4() + ".jpg"
            img.mv(path.resolve(__dirname, '..', 'static', fileName))
            const photo = await Photo.create({ img: fileName, item_uid })
            return res.json(photo)
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.query
            const photo = await Photo.findOne({ where: { id } })
            await photo.destroy()
            return res.json({ message: 'Photo deleted' })
        } catch (e) {
            console.log(e)
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new PhotoController()