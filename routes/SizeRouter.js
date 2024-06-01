const Router = require('express')
const router = new Router()
const sizeController = require('../controllers/SizeController')

router.post('/', sizeController.create)

module.exports = router