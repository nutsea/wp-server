const Router = require('express')
const router = new Router()
const userController = require('../controllers/UserController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, userController.checkUser)
router.put('/', authMiddleware, userController.update)
router.put('/password', authMiddleware, userController.setPassword)
router.put('/changePassword', authMiddleware, userController.changePassword)
router.get('/login', userController.login)
router.get('/one', userController.getUser)

module.exports = router