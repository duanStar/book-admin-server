const mysql = require('mysql')
const { host, user, password, database} = require('./config')
const { debug } = require('../utils/constant')
const { isObject } = require('../utils')

function connect() {
  return mysql.createConnection({
    host,
    user,
    password,
    database,
    multipleStatements: true
  })
}

function querySql(sql) {
  const conn = connect()
  debug && console.log(sql)
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, result) => {
        if (err) {
          debug && console.log('查询失败，原因:' + JSON.stringify(err))
          reject(err)
        } else {
          debug && console.log('查询成功', JSON.stringify(result))
          resolve(result)
        }
      })
    } catch(err) {
      reject(err)
    } finally {
      conn.end()
    }
  })
}

function queryOne(sql) {
  return new Promise((resolve, reject) => {
    querySql(sql).then(res => {
      if (res && res.length > 0) {
        resolve(res[0])
      } else {
        resolve(null)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

function insert(model, tableName) {
  return new Promise((resolve, reject) => {
    if (isObject(model)) {
      const keys = []
      const values = []
      Object.keys(model).forEach(key => {
        if (model.hasOwnProperty(key)) {
          keys.push(`\`${key}\``)
          values.push(`'${model[key]}'`)
        }
      })
      if (keys.length > 0 && values.length > 0) {
        let sql = `INSERT INTO \`${tableName}\` (`
        const keysString = keys.join(',')
        const valuesString = values.join(',')
        sql = `${sql}${keysString}) VALUES (${valuesString})`
        debug && console.log(sql)
        const conn = connect()
        try {
          conn.query(sql, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        } catch(err) {
          reject(err)
        } finally {
          conn.end()
        }
      } else {
        reject(new Error('插入数据库失败，对象中没有任何属性'))
      }
    } else {
      reject(new Error('插入数据库失败,插入数据非对象'))
    }
  })
}

function update(model, tableName, option) {
  return new Promise((resolve, reject) => {
    if (isObject(model)) {
      const entry = []
      Object.keys(model).forEach(key => {
        if (model.hasOwnProperty(key)) {
          entry.push(`\`${key}\`='${model[key]}'`)
        }
      })
      if (entry.length > 0) {
        let sql = `UPDATE \`${tableName}\` SET `
        const entryString = entry.join(',')
        sql = `${sql}${entryString} ${option}`
        debug && console.log(sql)
        const conn = connect()
        try {
          conn.query(sql, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        } catch(err) {
          reject(err)
        } finally {
          conn.end()
        }
      } else {
        reject(new Error('插入数据库失败，对象中没有任何属性'))
      }
    } else {
      reject(new Error('插入数据库失败,插入数据非对象'))
    }
  })
}

function and(where, key, val) {
  if (where === 'where') {
    return `${where} \`${key}\`='${val}'`
  } else {
    return `${where} and \`${key}\`='${val}'`
  }
}

function andLike(where, key, val) {
  if (where === 'where') {
    return `${where} \`${key}\` like '%${val}%'`
  } else {
    return `${where} and \`${key}\` like '%${val}%'`
  }
}

module.exports = {
  querySql,
  queryOne,
  insert,
  update,
  and,
  andLike
}