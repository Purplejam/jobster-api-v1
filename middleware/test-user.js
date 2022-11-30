const { BadRequestError} = require('../errors')

const testUser = (req, res, next) => {
	if(req.user.testUser) {
		throw new BadRequestError('Test user. Read only operations only')
	}
	next()
}

module.exports = testUser