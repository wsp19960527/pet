# 小流浪城市地图

流浪动物救助协作平台 — Monorepo 工程。

## 项目结构

```
pet/
├── apps/
│   ├── mobile/     # Expo App（iOS / Android）
│   ├── api/        # NestJS API
│   └── admin/      # Next.js 运营后台
├── packages/
│   └── shared/     # 共享类型与常量
├── docs/           # 设计文档
└── docker-compose.yml
```

## 快速开始

### 前置要求

- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop（MySQL + Redis）

### 1. 安装依赖

```bash
pnpm install
pnpm --filter @pet/shared build
```

### 2. 启动本地数据库

> 默认使用 **本机 MySQL 3306**（Homebrew）。详见 [docs/local-database.md](docs/local-database.md)。

```bash
cp .env.example apps/api/.env
# 在 apps/api/.env 填入 MYSQL_ROOT_PASSWORD=你的root密码
pnpm db:setup:local    # 建库 + 迁移 + 种子（推荐）
# Docker 备选：pnpm db:setup（13306 端口）
```

### 3. 数据库迁移与种子数据

`pnpm db:setup:local` 已包含此步骤。若只需补跑迁移：

```bash
pnpm prisma:migrate:deploy
pnpm --filter @pet/api prisma:seed
```

### 4. 启动服务

```bash
# 终端 1 — API (http://localhost:3000)
pnpm dev:api

# 终端 2 — Admin (http://localhost:3001)
pnpm dev:admin

# 终端 3 — Mobile
pnpm dev:mobile
```

## 默认账号

| 系统 | 账号 | 密码/验证码 |
|------|------|-------------|
| Admin | `admin@pet.local` | `admin123456` |
| App 登录 | 任意手机号 | 验证码 `123456`（Mock） |

## 本地数据库

开发连接：**127.0.0.1:3306**，用户 `pet` / 密码 `pet`，数据库 `pet`。

```bash
pnpm db:connect   # MySQL 命令行
pnpm db:studio    # 可视化管理
```

完整说明：[docs/local-database.md](docs/local-database.md)

## 常用命令

启动 API 后访问：http://localhost:3000/api/docs

### 核心接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/v1/auth/sms/send` | 发送验证码（Mock） |
| POST | `/api/v1/auth/login` | App 用户登录 |
| POST | `/admin/api/v1/auth/login` | Admin 登录 |

## 常用命令

```bash
pnpm db:setup     # 本地库一键初始化
pnpm db:connect   # 连接 psql
pnpm db:studio    # Prisma Studio
pnpm lint          # 全项目 lint
pnpm typecheck     # 全项目类型检查
pnpm build         # 构建所有包
pnpm test          # 运行测试
pnpm db:down       # 停止数据库
```

## 文档

- [技术方案](docs/technical-design.md)
- [UI 设计](docs/ui-design.md)
- [开发计划](docs/development-plan.md)
- [Admin 规划](docs/admin-design.md)
