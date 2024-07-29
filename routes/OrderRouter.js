const Router = require('express')
const router = new Router()
const orderController = require('../controllers/OrderController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/', authMiddleware, orderController.create)
router.get('/', authMiddleware, orderController.getAll)
router.get('/one', authMiddleware, orderController.getOne)
router.get('/client', authMiddleware, orderController.getClientOrders)
router.get('/items', authMiddleware, orderController.getOrderItems)
router.get('/report', authMiddleware, orderController.getOrderReport)

module.exports = router