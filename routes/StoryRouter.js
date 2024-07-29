const Router = require('express')
const router = new Router()
const storyController = require('../controllers/StoryController')
const adminMiddleware = require('../middleware/adminMiddleware')

router.post('/', adminMiddleware, storyController.create)
router.get('/', storyController.getAll)

module.exports = router