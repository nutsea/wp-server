const Router = require('express')
const router = new Router()
const constantsController = require('../controllers/ConstantsController')
const adminMiddleware = require('../middleware/adminMiddleware')

router.post('/', adminMiddleware, constantsController.update)
router.get('/', constantsController.getConstant)

module.exports = router