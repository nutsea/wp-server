const Router = require('express')
const router = new Router()
const storyController = require('../controllers/StoryController')

router.post('/', storyController.create)
router.get('/', storyController.getAll)

module.exports = router