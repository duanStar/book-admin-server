const express = require('express');
const boom = require('boom');
const userRouter = require('./user')
const bookRouter = require('./book')
const Result = require('../models/Result')

const jwtAuth = require('./jwt')

const router = express.Router();

router.use(jwtAuth)

router.get('/', function(req, res) {
  res.send('欢迎学习小慕读书管理后台')
})

router.use('/user', userRouter)
router.use('/book', bookRouter)

router.use((req, res, next) => {
  next(boom.notFound('接口不存在'))
})

router.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    new Result(null, 'token验证失败', {
      error: err.status || 401,
      errorMsg: err.name
    }).expired(res.status(err.status || 401))
  } else {
    const msg = (err && err.message) || '系统错误'
    const statusCode = (err.output && err.output.statusCode) || 500;
    const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.message
    new Result(null, msg, {
      error: statusCode,
      errorMsg
    }).fail(res.status(statusCode))
  }
})

module.exports = router
