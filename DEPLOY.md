# 部署指南

## 部署包内容

```
accounting-system.tar.gz
├── server.js              # 主服务器
├── database.js            # 数据模块
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定
├── ecosystem.config.js    # PM2 配置
├── Dockerfile             # Docker 配置
├── deploy.sh              # Linux 部署脚本
├── deploy.bat             # Windows 部署脚本
├── README.md              # 项目说明
└── public/
    └── index.html         # 前端页面
```

## 快速部署

### Linux 服务器

```bash
# 1. 解压
tar -xzf accounting-system.tar.gz
cd demo_project

# 2. 执行部署脚本
chmod +x deploy.sh
./deploy.sh

# 3. 启动服务
npm start
```

### Windows 服务器

```cmd
REM 1. 解压
REM 2. 双击运行 deploy.bat
```

### 使用 PM2（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### Docker 部署

```bash
# 构建
docker build -t accounting .

# 运行
docker run -d -p 3000:3000 --name accounting accounting-system
```

## 配置 nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 配置 HTTPS

```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 数据备份

数据存储在 `data.json` 文件中，定期备份此文件即可。

```bash
# 添加到 crontab
0 2 * * * cp /path/to/data.json /backup/data-$(date +\%Y\%m\%d).json
```
