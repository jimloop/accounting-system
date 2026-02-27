# 简单记账系统

一个基于 Node.js + MySQL 的记账系统，支持用户注册登录、账目管理、分类统计等功能。

## 功能特性

- 用户注册/登录/登出
- 添加/删除账目记录
- 收支分类管理
- 按月份/日期筛选账目
- 统计汇总（总收入、总支出、结余）
- 按分类统计

## 环境要求

- Node.js >= 14
- MySQL >= 5.7 或 MariaDB >= 10.3

## 快速开始

### 1. 配置数据库

复制并编辑环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=accounting
SESSION_SECRET=your-secret-key
PORT=3000
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

程序会自动创建表结构，或者手动执行：

```bash
mysql -u root -p < init.sql
```

### 4. 启动服务

```bash
npm start
```

访问 http://localhost:3000

## 部署方式

### 方式一：普通部署

```bash
# 1. 安装依赖
npm install

# 2. 配置 .env 文件
cp .env.example .env
# 编辑 .env 填入数据库配置

# 3. 启动
npm start
```

### 方式二：PM2（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 方式三：Docker Compose（推荐）

```bash
# 一键启动应用和 MySQL
docker-compose up -d
```

### 方式四：单独 Docker

```bash
# 构建镜像
docker build -t accounting-system .

# 运行（需要外部 MySQL）
docker run -d -p 3000:3000 --env-file .env accounting-system
```

## 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| DB_HOST | MySQL 主机地址 | localhost |
| DB_PORT | MySQL 端口 | 3306 |
| DB_USER | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名称 | accounting |
| SESSION_SECRET | Session 密钥 | - |
| PORT | 服务端口 | 3000 |

## 防火墙设置

```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## 文件结构

```
├── server.js          # 主服务器文件
├── database.js        # 数据库模块
├── init.sql           # 数据库初始化脚本
├── package.json       # 项目配置
├── .env.example       # 环境变量示例
├── ecosystem.config.js # PM2 配置
├── docker-compose.yml  # Docker Compose 配置
├── Dockerfile         # Docker 配置
└── public/
    └── index.html     # 前端页面
```

## 数据备份

```bash
# 备份数据库
mysqldump -u root -p accounting > backup-$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p accounting < backup-20240101.sql
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/register | 用户注册 |
| POST | /api/login | 用户登录 |
| POST | /api/logout | 用户登出 |
| GET | /api/user | 获取当前用户 |
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 添加分类 |
| DELETE | /api/categories/:id | 删除分类 |
| GET | /api/records | 获取账目列表 |
| POST | /api/records | 添加账目 |
| DELETE | /api/records/:id | 删除账目 |
| GET | /api/statistics | 获取统计数据 |
| GET | /api/monthly-stats | 获取月度趋势 |
