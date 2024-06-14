const Router = require('express')
const router = new Router()
const itemController = require('../controllers/ItemController')

router.post('/', itemController.create)
router.get('/all', itemController.getAll)
router.get('/popular', itemController.getPopular)
router.get('/one', itemController.getOne)
router.get('/ids', itemController.getByIds)
router.get('/watched', itemController.getByIds)
router.get('/brands', itemController.getBrandsAndModels)

module.exports = router