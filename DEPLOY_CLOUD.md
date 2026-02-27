# 部署到云服务器

## 部署包
`D:\claude-projects\accounting-system-mysql.tar.gz`

## 部署步骤

### 1. 上传文件到服务器
```bash
# 方式 1: scp 上传
scp accounting-system-mysql.tar.gz root@your-server:/opt/

# 方式 2: 使用 FileZilla 等工具上传
```

### 2. 服务器端操作
```bash
cd /opt
tar -xzf accounting-system-mysql.tar.gz
cd demo_project
```

### 3. 配置环境变量
```bash
cp .env.example .env
vim .env  # 编辑数据库配置
```

### 4. 安装依赖
```bash
npm install --production
```

### 5. 启动服务
```bash
# 直接启动
PORT=3000 npm start

# 或使用 PM2 (推荐)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 防火墙设置
```bash
# 开放端口
ufw allow 3000
# 或
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --reload
```

## nginx 反向代理 (可选)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
