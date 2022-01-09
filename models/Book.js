const { MIME_TYPE_EPUB, UPLOAD_URL, UPLOAD_PATH, OLD_UPLOAD_URL } = require('../utils/constant')
const fs = require('fs')
const Epub = require('../utils/epub')
const AdmZip = require('adm-zip')
const parseString = require('xml2js').parseString
const path = require('path')

class Book {
  constructor(file, data) {
    if(file) {
      this.createBookFromFile(file)
    } else if(data) {
      this.createBookFromData(data)
    }
  }
  createBookFromFile(file) {
    const { destination, filename, mimetype=MIME_TYPE_EPUB, path, originalname } = file
    const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
    const oldBookPath = path
    const bookPath = `${destination}/${filename}${suffix}`
    const url = `${UPLOAD_URL}/book/${filename}${suffix}`
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
    if(!fs.existsSync(unzipPath)) {
      fs.mkdirSync(unzipPath, { recursive: true })
    }
    if(fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath, bookPath)
    }
    this.filename = filename
    // 电子书路径
    this.path = `/book/${filename}${suffix}`
    this.filePath = this.path
    // 电子书解压路径
    this.unzipPath = `/unzip/${filename}`
    // 电子书url
    this.url = url
    this.title = ''
    this.author = ''
    this.publisher = ''
    // 目录
    this.contents = []
    // 目录树
    this.contentsTree = []
    // 封面url
    this.cover = ''
    // 封面路径
    this.coverPath = ''
    this.category = -1
    this.categoryText = ''
    this.language = ''
    // 电子书解压url
    this.unzipUrl = unzipUrl
    this.originalName = originalname
  }
  createBookFromData(data) {
    this.filename = data.filename
    this.cover = data.cover
    this.author = data.author
    this.title = data.title
    this.publisher = data.publisher
    this.bookId = data.filename
    this.language = data.language
    this.rootFile = data.rootFile
    this.path = data.path || data.filePath
    this.filePath = data.path || data.filePath
    this.unzipPath = data.unzipPath
    this.coverPath = data.coverPath
    this.createUser = data.username
    this.createDt = new Date().getTime()
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : 1
    this.category = data.category || 99
    this.categoryText = data.categoryText || '自定义'
    this.contents = data.contents || []
    this.originalName = data.originalName || ''
  }
  parse() {
    return new Promise((resolve, reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      if (!fs.existsSync(bookPath)) {
        reject(new Error('电子书不存在'))
      }
      const epub = new Epub(bookPath)
      epub.on('error', err => {
        reject(err)
      })
      epub.on('end', err => {
        if (err) {
          reject(err)
        } else {
          const { title, language, creator, creatorFileAs, cover, publisher } = epub.metadata
          if (!title) {
            reject(new Error('图书标题为空'))
          } else {
            this.title = title
            this.language = language || 'en'
            this.author = creator || creatorFileAs || 'unknown'
            this.publisher = publisher || 'unknown'
            this.rootFile = epub.rootFile
            try {
              const handleGetImage = (err, file, mimeType) => {
                if (err) {
                  reject(err)
                } else {
                  const suffix = mimeType.split('/')[1]
                  const coverPath = `${UPLOAD_PATH}/img/${this.filename}.${suffix}`
                  const coverUrl = `${UPLOAD_URL}/img/${this.filename}.${suffix}`
                  this.cover = coverUrl
                  fs.writeFileSync(coverPath, file, 'binary')
                  this.coverPath = `/img/${this.filename}.${suffix}`
                  resolve(this)
                }
              }
              this.unzip()
              this.parseContents(epub).then(({ chapters, chapterTree }) => {
                this.contents = chapters
                this.contentsTree = chapterTree
                epub.getImage(cover, handleGetImage)
              })
            } catch(err) {
              reject(err)
            }
          }
        }
      })
      epub.parse()
    })
  }
  unzip() {
    const zip = new AdmZip(Book.genPath(this.path))
    zip.extractAllTo(Book.genPath(this.unzipPath), true)
  }
  parseContents(epub) {
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id
      if (ncx) {
        return ncx
      } else {
        return manifest[id].href
      }
    }
    function findParent(arr, level = 0, pid = '') {
      return arr.map(item => {
        item.level = level,
        item.pid = pid
        if (item.navPoint && item.navPoint.length > 0) {
          item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
        } else if (item.navPoint) {
          item.navPoint.level = level + 1
          item.navPoint.pid = item['$'].id
        }
        return item
      })
    }
    function flatten(arr) {
      return [].concat(...arr.map(item => {
        if (item.navPoint && item.navPoint.length > 0) {
          return [].concat(item, ...flatten(item.navPoint))
        } else if (item.navPoint) {
          return [].concat(item, item.navPoint)
        }
        return item
      }))
    }
    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        const xml = fs.readFileSync(ncxFilePath, 'utf-8')
        const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '')
        const filename = this.filename
        parseString(xml, {
          explicitArray: false,
          ignoreAttrs: false
        }, (err, json) => {
          if (err) {
            reject(err)
          } else {
            const navMap = json.ncx.navMap
            if (navMap.navPoint && navMap.navPoint.length > 0) {
              navMap.navPoint = findParent(navMap.navPoint)
              const newNavMap = flatten(navMap.navPoint)
              const chapters = []
              newNavMap.forEach((chapter, index) => {
                const src = chapter.content['$'].src
                chapter.id = `${src}`
                chapter.href = `${dir}/${src}`.replace(this.unzipPath, '')
                chapter.text = `${UPLOAD_URL}${dir}/${src}`
                chapter.label = chapter.navLabel.text || ''
                chapter.navId = chapter['$'].id
                chapter.order = index + 1
                chapter.filename = filename
                chapters.push(chapter)
              })
              const chapterTree = Book.genContentsTree(chapters)
              resolve({ chapters, chapterTree })
            } else {
              reject(new Error('目录解析失败，目录数为0'))
            }
          }
        })
      })
    } else {
      throw new Error('目录文件不存在')
    }
  }
  toDb() {
    return {
      fileName: this.filename,
      cover: this.cover,
      author: this.author,
      title: this.title,
      publisher: this.publisher,
      bookId: this.filename,
      language: this.language,
      rootFile: this.rootFile,
      filePath: this.filePath,
      unzipPath: this.unzipPath,
      coverPath: this.coverPath,
      createUser: this.username,
      createDt: this.createDt,
      updateDt: this.updateDt,
      updateType: this.updateType,
      category: this.category,
      categoryText: this.categoryText,
      originalName: this.originalName
    }
  }
  getContents() {
    return this.contents
  }
  reset() {
    if (Book.pathExists(this.filePath)) {
      fs.unlinkSync(Book.genPath(this.filePath))
    }
    if (Book.pathExists(this.coverPath)) {
      fs.unlinkSync(Book.genPath(this.coverPath))
    }
    if (Book.pathExists(this.unzipPath)) {
      fs.rmdirSync(Book.genPath(this.unzipPath), { recursive: true })
    }
  }
  static genPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }
  static pathExists(path) {
    if (path.startsWith(UPLOAD_PATH)) {
      return fs.existsSync(path)
    } else {
      return fs.existsSync(Book.genPath(path))
    }
  }
  static genCoverUrl(book) {
    const { cover } = book
    if (book.updateType === '0') {
      if (cover) {
        if (cover.startsWith('/')) {
          return `${OLD_UPLOAD_URL}${cover}`
        } else {
          return `${OLD_UPLOAD_URL}/${cover}`
        }
      } else {
        return null
      }
    } else {
      if (cover) {
        if (!cover.startsWith('https')) {
          return `${UPLOAD_URL}/${cover}`
        } else {
          return cover
        }
      } else {
        return null
      }
    }
  }
  static genContentsTree(contents) {
    if (!contents) {
      return null
    }
    const contentsTree = []
    contents.forEach(c => {
      c.children = []
      if (c.pid === '') {
        contentsTree.push(c)
      } else {
        const parent = contents.find(item => item.navId === c.pid)
        parent.children.push(c)
      }
    })
    return contentsTree
  }
}

module.exports = Book;
