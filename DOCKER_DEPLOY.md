# Docker 部署指南

## 方式一：使用现有 MySQL（推荐）

如果你的云服务器已有 MySQL，只需部署应用容器：

### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    image: accounting-system:latest
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=101.132.36.72
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=lxf971103
      - DB_NAME=accounting
      - SESSION_SECRET=your-secret-key-change-this
    restart: unless-stopped
```

### 2. 构建并运行

```bash
# 构建镜像
docker build -t accounting-system .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=101.132.36.72 \
  -e DB_USER=root \
  -e DB_PASSWORD=lxf971103 \
  -e DB_NAME=accounting \
  -e SESSION_SECRET=your-secret-key \
  --name accounting \
  accounting-system
```

---

## 方式二：完整 Docker Compose（应用 + MySQL）

适合全新部署，包含 MySQL 数据库：

### 1. 使用 docker-compose.yml

```bash
# 直接启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2. 数据持久化

MySQL 数据存储在 Docker volume `mysql_data` 中，容器删除后数据不丢失。

---

## 云服务器部署步骤

### 1. 上传项目到服务器

```bash
# 在本地打包
cd D:\claude-projects
tar -czf accounting-docker.tar.gz demo_project/

# 上传到服务器 (替换为你的服务器 IP)
scp accounting-docker.tar.gz root@101.132.36.72:/opt/
```

### 2. 服务器端操作

```bash
# SSH 登录服务器
ssh root@101.132.36.72

# 解压
cd /opt
tar -xzf accounting-docker.tar.gz
cd demo_project

# 修改 docker-compose.yml 中的环境变量
vim docker-compose.yml
```

### 3. 构建并启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 4. 开放防火墙端口

```bash
# Ubuntu/Debian
ufw allow 3000

# CentOS
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --reload
```

### 5. 访问应用

```
http://101.132.36.72:3000
```

---

## Docker 命令参考

```bash
# 查看所有容器
docker ps -a

# 查看容器日志
docker logs accounting

# 进入容器
docker exec -it accounting bash

# 重启容器
docker restart accounting

# 停止并删除
docker stop accounting && docker rm accounting

# 删除镜像
docker rmi accounting-system
```

---

## 使用现有 MySQL 的配置

如果连接外部 MySQL（如云服务器 RDS），修改环境变量：

```bash
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-mysql-host.com \
  -e DB_PORT=3306 \
  -e DB_USER=your-user \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=accounting \
  --name accounting \
  accounting-system
```

---

## 故障排查

### 容器启动失败
```bash
# 查看日志
docker logs accounting

# 查看容器详情
docker inspect accounting
```

### 无法连接数据库
```bash
# 测试数据库连接
docker exec accounting ping 101.132.36.72
```

### 重建容器
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
