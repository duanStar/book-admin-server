# 图书后台管理系统后端

### 前端地址
[vue-book-admin](https://github.com/duanStar/vue-book-admin)

### 初始化数据库

创建数据库 book，执行book.sql

### 配置nginx(示例)

创建文件上传文件夹

~~~
如：在/Users/root下创建uplao文件夹
mkdir upload
~~~

添加 `/Users/root/upload/upload.conf` 文件，配置如下：

```bash
server
{ 
  charset utf-8;
  listen 8089;
  server_name http_host;
  root /Users/sam/upload/;
  autoindex on;
  add_header Cache-Control "no-cache, must-revalidate";
  location / { 
    add_header Access-Control-Allow-Origin *;
  }
}
```

如果需要加入 https 服务，可以再添加一个 server：

```bash
server
{
  listen 443 default ssl;
  server_name https_host;
  root /Users/sam/upload/;
  autoindex on;
  add_header Cache-Control "no-cache, must-revalidate";
  location / {
    add_header Access-Control-Allow-Origin *;
  }
  ssl_certificate /Users/root/Desktop/https/xxxxxx.pem;
  ssl_certificate_key /Users/root/Desktop/https/xxxxxx.key;
  ssl_session_timeout  5m;
  ssl_protocols  SSLv3 TLSv1;
  ssl_ciphers  ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;
  ssl_prefer_server_ciphers  on;
}
```

打开配置文件 nginx.conf：

- windows 位于安装目录下
- macOS 位于：`/usr/local/etc/nginx/nginx.conf`

在结尾大括号之前添加：

```bash
include /Users/root/upload/upload.conf;
```

### 启动服务

启动 nginx 服务：

```bash
sudo nginx
```

重启 nginx 服务：

```bash
sudo nginx -s reload
```

停止 nginx 服务：

```bash
sudo nginx -s stop
```

检查配置文件是否存在语法错误：

```bash
sudo nginx -t
```

