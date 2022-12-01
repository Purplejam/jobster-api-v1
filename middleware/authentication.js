const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')

const auth = async (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new UnauthenticatedError('Authentication invalid')
  }
  // take token info from header auth
  const token = authHeader.split(' ')[1]
  //
  //try verify users token
  //if true put user in request (name and id)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const testUser = payload.userId === '6334475222d615b1fbc1b782'
    //add testUser to req.user
    req.user = { userId: payload.userId, testUser }
    next()
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid')
  }
}

module.exports = auth
