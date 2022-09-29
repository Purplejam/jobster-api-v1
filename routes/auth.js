const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/auth')
const authMiddlewere = require('../middleware/authentication')
const {updateUser} = require('../controllers/auth')

//routes
router.post('/register', register)
router.post('/login', login)
router.patch('/updateUser', authMiddlewere, updateUser)

module.exports = router
