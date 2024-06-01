const Router = require('express')
const router = new Router()
const photoController = require('../controllers/PhotoController')

router.post('/', photoController.create)

module.exports = router