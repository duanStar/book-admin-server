const Book = require('../models/Book');
const { insert, queryOne, querySql, update, and, andLike } = require('../db');
const _ = require('lodash');

async function exists(book) {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  const result = await queryOne(sql)
  return result
}

async function removeBook(book) {
  if (book) {
    book.reset()
    if (book.filename) {
      const removeBooksSql = `delete from book where fileName='${book.filename}'`
      const removeContentsSql = `delete from contents where fileName='${book.filename}'`
      await querySql(removeBooksSql)
      await querySql(removeContentsSql)
    }
  }
}

async function insertContents(book) {
  const contents = book.getContents()
  if (contents && contents.length > 0) {
    for(let i = 0; i < contents.length; i++) {
      const content = contents[i]
      const _content = _.pick(content, ['filename', 'id', 'href', 'order', 'level', 'label', 'pid', 'navId', 'text'])
      _content.fileName = _content.filename
      delete _content.filename
      await insert(_content, 'contents')
    }
  }
}

function insertBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      if (book instanceof Book) {
        const result = await exists(book)
        if (result) {
          await removeBook(book)
          reject(new Error('电子书已存在'))
        } else {
          await insert(book.toDb(), 'book')
          await insertContents(book)
          resolve()
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch(err) {
      reject(err)
    }
  })
}

function getBook(filename) {
  return new Promise(async (resolve, reject) => {
    const bookSql = `select * from book where fileName='${filename}'`
    const contentsSql = `select * from contents where fileName='${filename}' order by \`order\``
    const book = await queryOne(bookSql)
    const contents = await querySql(contentsSql)
    if (book) {
      book.cover = Book.genCoverUrl(book)
      book.contents = contents
      const contentsTree = Book.genContentsTree(contents)
      book.contentsTree = contentsTree
      resolve({ book })
    } else {
      reject(new Error('电子书不存在'))
    }
  })
}

function updateBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      if (book instanceof Book) {
        const result = await getBook(book.filename)
        if (result) {
          const model = book.toDb()
          if (result.updateType === 0) {
            reject(new Error('内置图书不能编辑'))
          } else {
            await update(model, 'book', `where fileName='${book.filename}'`)
            resolve()
          }
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch(err) {
      reject(err)
    }
  })
}

function getCategory() {
  return new Promise(async (resolve, reject) => {
    const sql =  'select * from category order by category'
    try {
      const result = await querySql(sql)
      const categoryList = []
      result.forEach(item => {
        categoryList.push({
          value: item.category,
          label: item.categoryText,
          num: item.num
        })
      })
      resolve(categoryList)
    } catch(err) {
      reject(err)
    }
  })
}

function getBookList(query) {
  const { category, author, title, page = 1, pageSize = 20, sort } = query
  const offset = (page - 1) * pageSize
  let bookSql = 'select * from book'
  let countSql = `select count(*) as count from book`
  let where = 'where'
  title && (where = andLike(where, 'title', title))
  author && (where = andLike(where, 'author', author))
  category && (where = and(where, 'categoryText', category))
  if (where !== 'where') {
    bookSql = `${bookSql} ${where}`
    countSql = `${countSql} ${where}`
  }
  if (sort) {
    const symbol = sort[0]
    const column = sort.substring(1)
    const order = symbol === '+' ? 'asc' : 'desc'
    bookSql = `${bookSql} order by ${column} ${order}`
  }
  bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
  return new Promise(async (resolve, reject) => {
    try {
      const count = await querySql(countSql)
      const list = await querySql(bookSql)
      list.forEach(book => {
        book.cover = Book.genCoverUrl(book)
      })
      resolve({ list, count: count[0].count, page, pageSize })
    } catch(err) {
      reject(err)
    }
  })
}

function deleteBook(fileName) {
  return new Promise(async (resolve, reject) => {
    const { book } = await getBook(fileName)
    if (book) {
      if (book.updateType === '0') {
        reject(new Error('内置电子书不能删除'))
      } else {
        const bookObj = new Book(null, book)
        const sql = `delete from book where \`fileName\`='${fileName}'`
        const removeContentsSql = `delete from contents where fileName='${book.filename}'`
        await querySql(removeContentsSql)
        querySql(sql).then(() => {
          bookObj.reset()
          resolve()
        }).catch(err => {
          reject(err)
        })
      }
    } else {
      reject(new Error('电子书不存在'))
    }
    resolve()
  })
}

module.exports = {
  insertBook,
  getBook,
  updateBook,
  getCategory,
  getBookList,
  deleteBook
}
