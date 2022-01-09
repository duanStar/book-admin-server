const { env } = require('./env')

const UPLOAD_PATH = env === 'dev' ? 'F:\\html\\upload\\admin-upload-ebook' : '/root/upload/admin-upload-ebook'

const UPLOAD_URL = env === 'dev' ? 'https://back.duanhf.cn/admin-upload-ebook' : 'https://back.duanhf.cn/admin-upload-ebook/book'

const OLD_UPLOAD_URL = env === 'dev' ? 'http://book.youbaobao.xyz/book/res/img' : 'http://book.youbaobao.xyz/book/res/img'

module.exports = {
  CODE_ERROR: -1,
  CODE_SUCCESS: 0,
  debug: process.env.NODE_ENV === 'development',
  PWD_SALT: 'admin_imooc_node',
  PRIVATE_KEY: 'admin_imooc_node_test_youbaobao_xyz',
  JWT_EXPIRED: 60 * 60,
  CODE_TOKEN_EXPIRED: -2,
  UPLOAD_PATH,
  MIME_TYPE_EPUB: 'application/epub+zip',
  UPLOAD_URL,
  OLD_UPLOAD_URL
}