const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY } = require('./constant')

function md5(s) {
  return crypto.createHash('md5').update(String(s)).digest('hex')
}

function decode(req) {
  const authorization = req.headers['authorization']
  let token = ''
  if (authorization.indexOf('Bearer ') >= 0) {
    token = authorization.replace('Bearer ', '')
  } else {
    token = authorization
  }
  return jwt.verify(token, PRIVATE_KEY)
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

module.exports = {
  md5,
  decode,
  isObject
}