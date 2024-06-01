const Router = require('express')
const router = new Router()
const userController = require('../controllers/UserController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, userController.checkUser)
router.put('/', authMiddleware, userController.update)

module.exports = router