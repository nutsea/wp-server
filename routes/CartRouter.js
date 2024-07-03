const Router = require('express')
const router = new Router()
const cartController = require('../controllers/CartController')

router.post('/', cartController.create)
router.get('/', cartController.getUserCart)
router.delete('/', cartController.deleteOne)

module.exports = router