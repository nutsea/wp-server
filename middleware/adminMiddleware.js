const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        next()
    }
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return res.status(403).json({message: 'Не авторизован'})
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decoded

        // Check if the user has the role of admin
        if (req.user.role !== 'admin' || req.user.role !== 'main') {
            return res.status(403).json({message: 'Недостаточно прав'})
        }

        next()
    } catch (e) {
        res.status(403).json({message: 'Не авторизован'})
    }
}