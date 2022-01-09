const { querySql, queryOne } = require("../db")

async function login(username, password) {
  const result = await querySql(`select * from admin_user where username='${username}' and password='${password}'`)
  return result
}

async function findUser(username) {
  const result = await queryOne(`select id, username, nickname, role, avatar from admin_user where username='${username}'`)
  return result
}

module.exports = {
  login,
  findUser
}