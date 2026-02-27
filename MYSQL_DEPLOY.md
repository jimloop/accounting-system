# MySQL 版部署包

## 文件位置
`D:\claude-projects\accounting-system-mysql.tar.gz`

## 升级内容

✅ **数据存储改为 MySQL**
- 使用 `mysql2` 驱动
- 数据库连接池
- 自动建表

✅ **新增文件**
- `.env.example` - 环境变量模板
- `init.sql` - 数据库初始化脚本
- `docker-compose.yml` - Docker Compose 配置（含 MySQL）

✅ **修改文件**
- `database.js` - MySQL 数据库模块
- `server.js` - 改用 MySQL 查询
- `package.json` - 新增 mysql2、dotenv 依赖
- `README.md` - 更新部署说明

## 部署步骤

### 1. 配置 MySQL

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE accounting DEFAULT CHARACTER SET utf8mb4;"
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 MySQL 配置
```

### 3. 安装依赖并启动

```bash
npm install
npm start
```

### 或使用 Docker Compose（最简单）

```bash
docker-compose up -d
```

## 数据备份

```bash
# 备份
mysqldump -u root -p accounting > backup.sql

# 恢复
mysql -u root -p accounting < backup.sql
```
