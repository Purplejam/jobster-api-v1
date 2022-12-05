const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')
const mongoose = require('mongoose')
const moment = require('moment')

const getAllJobs = async (req, res) => {
  const {search, status, jobType, sort} = req.query
  //search jobs with userId only
  const queryObject = {
    createdBy: req.user.userId
  }
  if (search && search !== 'all') queryObject.position = search
  if (status && status !== 'all') queryObject.status = status
  if (jobType && jobType !== 'all') queryObject.jobType = jobType
  
  let result = Job.find(queryObject)
 
  //add sorting logic
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 4
  const skip = (page - 1) * limit

  const totalJobs = await Job.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalJobs / limit)

  result = result.skip(skip).limit(limit)
  const jobs = await Job.find(result)
  
  res.status(StatusCodes.OK).json({jobs, numOfPages, totalJobs})
}

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId
  const job = await Job.create(req.body)
  res.status(StatusCodes.CREATED).json({ job })
}

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).send()
}


const showStats = async (req, res) => {
  //get array with status and totalJobs with this status
  let stats = await Job.aggregate([
    {$match: {createdBy: mongoose.Types.ObjectId(req.user.userId)}},
    {$group: {
      _id: "$status",
      totalJobs: {
        $count: {}
      }
    }}
   ])

  stats = stats.reduce((acc, curr) => {
    const {_id: title, totalJobs} = curr
    acc[title] = totalJobs
    return acc
  }, {});

  //add default stats, if there is no such stats – equal 0
  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  //monthly app-ns
  //match by createdBy
  //group by year and month and count

  let testApplication = await Job.aggregate([
      {$match: {createdBy: mongoose.Types.ObjectId(req.user.userId)}},
      {$group: {
        _id: {year: {$year: '$createdAt'}, month: {$month: '$createdAt'}},
        count: {
          $count: {}
        }
      }}, 
      {$sort: {'_id.year': -1, '_id.month': -1}},
      {$limit: 6}
    ])
  console.log(testApplication)

  testApplication = testApplication.map((item) => {
    const {_id: {year, month}, count} = item
    const date = moment()
      .month(month - 1)
      .year(year)
      .format('MMM Y')
    return { date, count }
  }).reverse()

  console.log(testApplication)

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
  ]);

  
  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format('MMM Y');
      return { date, count }
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
}

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats
}
