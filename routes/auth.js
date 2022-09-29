const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/auth')
const authMiddlewere = require('../middleware/authentication')
const {updateUser} = require('../controllers/auth')
const testUser = require('../middleware/test-user')
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: {
		msg: 'To many requests, please try again in 15 minutes later'
	}
})

//routes
router.post('/register', apiLimiter, register)
router.post('/login', apiLimiter, login)
router.patch('/updateUser', authMiddlewere, testUser, updateUser)

module.exports = router
