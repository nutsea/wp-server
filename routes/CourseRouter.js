const Router = require('express')
const router = new Router()
const courseController = require('../controllers/CourseController')
const adminMiddleware = require('../middleware/adminMiddleware')

router.post('/', adminMiddleware, courseController.update)
router.get('/', courseController.getCourse)

module.exports = router