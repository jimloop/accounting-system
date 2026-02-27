# Docker 部署 - 免命令行配置方案

## 方案一：.env 文件（推荐）★

### 部署步骤

```bash
# 1. 上传项目到服务器
scp accounting-docker.tar.gz root@服务器 IP:/opt/

# 2. SSH 登录
ssh root@服务器 IP

# 3. 解压
cd /opt
tar -xzf accounting-docker.tar.gz
cd demo_project

# 4. 复制并编辑配置文件
cp .env.production .env
vim .env  # 修改数据库配置

# 5. 一键启动（自动读取 .env 文件）
docker-compose -f docker-compose.simple.yml up -d
```

### 优势
- ✅ 配置与命令分离
- ✅ 修改配置只需编辑 `.env` 文件
- ✅ 重启时自动加载新配置
- ✅ 无需记忆复杂命令

---

## 方案二：config 文件挂载

### 1. 创建配置文件

```bash
# 在服务器上创建配置目录
mkdir -p /opt/accounting/config

# 创建配置文件
cat > /opt/accounting/config/app.conf << 'EOF'
DB_HOST=101.132.36.72
DB_PORT=3306
DB_USER=root
DB_PASSWORD=lxf971103
DB_NAME=accounting
SESSION_SECRET=your-secret-key
PORT=3000
EOF
```

### 2. 使用挂载方式运行

```bash
docker run -d \
  -p 3000:3000 \
  -v /opt/accounting/config/app.conf:/app/.env \
  --name accounting \
  accounting-system
```

---

## 方案三：使用 Docker Secrets（最安全）

适合 Docker Swarm 环境：

```bash
# 创建 secret
echo "lxf971103" | docker secret create db_password -

# 在 docker-compose.yml 中使用
# secrets:
#   - db_password
```

---

## 推荐：方案一使用流程

```bash
# 第一次部署
tar -xzf accounting-docker.tar.gz
cd demo_project
cp .env.production .env
vim .env                    # 编辑配置
docker-compose -f docker-compose.simple.yml up -d

# 后续修改配置
vim .env                    # 修改配置
docker-compose -f docker-compose.simple.yml restart

# 查看状态
docker-compose -f docker-compose.simple.yml ps

# 查看日志
docker-compose -f docker-compose.simple.yml logs -f
```
