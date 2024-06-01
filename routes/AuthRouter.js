const Router = require('express')
const router = new Router()
const authController = require('../controllers/AuthController')

router.post('/', authController.create)
router.get('/', authController.authUser)

module.exports = router