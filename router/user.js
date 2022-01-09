const express = require('express')
const Result = require('../models/Result')
const { login, findUser } = require('../services/user')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const { PWD_SALT } = require('../utils/constant')
const { md5, decode } = require('../utils')
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')
const router = express.Router()

router.get('/info', async function(req, res, next) {
  const { username } = decode(req)
  if (username) {
    const user = await findUser(username)
    if (user) {
      user.roles = [].concat(user.role)
      new Result(user, '用户信息查询成功').success(res)
    } else {
      new Result('用户信息查询失败').fail(res)
    }
  } else {
    new Result('用户信息查询失败').fail(res)
  }
})

router.post('/login',
  [
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
  ],
  async function(req, res) {
    const err = validationResult(req)
    if (!err.isEmpty()) {
      const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      let { username, password } = req.body
      password = md5(password + PWD_SALT)
      const user = await login(username, password)
      if (!user || user.length === 0) {
        new Result('登录失败').fail(res)
      } else {
        const token = jwt.sign(
          { username },
          PRIVATE_KEY,
          { expiresIn: JWT_EXPIRED }
        )
        new Result({ token }, '登录成功').success(res)
      }
    }
  }
)

module.exports = router