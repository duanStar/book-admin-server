const express = require('express');
const multer = require('multer');
const { UPLOAD_PATH } = require('../utils/constant');
const Result = require('../models/Result');
const Book = require('../models/Book');
const boom = require('boom');
const { decode } = require('../utils')
const { insertBook, getBook, updateBook, getCategory, getBookList, deleteBook } = require('../services/book')

const router = express.Router();

router.post('/upload', multer({ dest: `${UPLOAD_PATH}/book` }).single('file'), (req, res, next) => {
  if (!req.file || req.file.length === 0) {
    new Result('上传电子书失败').fail(res)
  } else {
    const book = new Book(req.file)
    book.parse().then((book) => {
      // console.log(book)
      new Result(book, '电子书上传成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
})

router.post('/create', (req, res, next) => {
  const { username } = decode(req)
  if (username) {
    req.body.username = username
  }
  const book = new Book(null, req.body)
  insertBook(book).then(() => {
    new Result('添加电子书成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.get('/get', (req, res, next) => {
  const filename = req.query.filename
  if (!filename) {
    next(boom.badRequest(new Error('参数filename不能为空')))
  } else {
    getBook(filename).then(book => {
      new Result(book, '获取图书信息成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
})

router.post('/update', (req, res, next) => {
  const { username } = decode(req)
  if (username) {
    req.body.username = username
  }
  const book = new Book(null, req.body)
  updateBook(book).then(() => {
    new Result('更新电子书成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.get('/category', (req, res, next) => {
  getCategory().then(category => {
    new Result(category, '获取分类成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.get('/list', (req, res, next) => {
  getBookList(req.query).then(({ list, count, page, pageSize }) => {
    new Result({ list, count, page: +page, pageSize: +pageSize }, '获取图书列表成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.delete('/delete', (req, res, next) => {
  const fileName = req.query.fileName
  if (!fileName) {
    next(boom.badRequest(new Error('参数fileName不能为空')))
  } else {
    deleteBook(fileName).then(() => {
      new Result('删除图书信息成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
})

module.exports = router
