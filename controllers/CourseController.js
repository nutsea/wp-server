const { Course } = require('../models/models')
const ApiError = require('../error/apiError')

class CourseController {
    async update(req, res, next) {
        try {
            const { course } = req.body
            const lastCourse = await Course.findAll()
            lastCourse[0].course = course
            await lastCourse[0].save()
            return res.json(lastCourse[0])
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getCourse(req, res, next) {
        try {
            const course = await Course.findAll()
            return res.json(course[0])
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new CourseController()