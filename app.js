const express = require('express');
const router = require('./router');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use('/', router);

const privateKey = fs.readFileSync('./https/6849405_back.duanhf.cn.key')
const pem = fs.readFileSync('./https/6849405_back.duanhf.cn.pem')
const credentials = {
  key: privateKey,
  cert: pem
}
const httpsServer = https.createServer(credentials, app);

const server = app.listen(5000, () => {
  const { address, port } = server.address()
  console.log('Http Server is running on http://%s:%s', address, port)
})
httpsServer.listen(18082, () => {
  console.log('Https Server is running on https://back.duanhf.cn:%s', 18082)
})