require('dotenv').config()

const mocksData = require('./mock-data.json')

const Job = require('./models/Job')
const connectDB = require('./db/connect')


const populate = async() => {
	try {
		await connectDB(process.env.MONGO_URI)
		await Job.deleteMany()
		await Job.create(mocksData)
		process.exit(0)
	} catch(e) {
		console.log(e)
		process.exit(1)
	}
}

populate()