# 本地数据库开发指南

默认使用 **本机 Homebrew MySQL（3306）**。可选 Docker MySQL（13306），见文末。

## 一键初始化（本机 MySQL）

```bash
cp .env.example apps/api/.env   # 首次
# 在 apps/api/.env 填入 MYSQL_ROOT_PASSWORD=你的root密码
pnpm db:setup:local             # 建库 + 迁移 + 种子
pnpm dev:api
```

## 连接信息（本机）

| 项 | 值 |
|----|-----|
| Host | `127.0.0.1` |
| Port | **3306** |
| User | `pet` |
| Password | `pet` |
| Database | `pet` |

**Prisma / API 连接串**（已写入 `apps/api/.env`）：

```
mysql://pet:pet@127.0.0.1:3306/pet
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm db:setup:local` | 本机 MySQL 建库 + 迁移 + 种子 |
| `pnpm db:connect` | 进入本机 MySQL 命令行（pet 用户） |
| `pnpm db:studio` | 打开 Prisma Studio |
| `pnpm db:status` | 查看迁移状态 |
| `pnpm prisma:migrate` | 开发中新迁移（interactive） |
| `pnpm prisma:migrate:deploy` | 仅应用已有迁移 |
| `pnpm dev:api` | 启动 API |

## GUI 工具

TablePlus、DBeaver、Navicat 等选 **MySQL**，Host `127.0.0.1`，Port `3306`，用户 `pet` / 密码 `pet`。

## 默认种子账号

| 表 | 字段 | 值 |
|----|------|-----|
| admin_users | email | `admin@pet.local` |
| admin_users | password | `admin123456` |

## 地图坐标

动物位置用 `latitude` / `longitude`（WGS84），不依赖 PostGIS。可直接：

```sql
SELECT id, species, latitude, longitude FROM animals LIMIT 10;
```

## 故障排查

### 本机 MySQL 未启动

```bash
brew services start mysql
pnpm db:setup:local
```

### Access denied（pet 用户）

重新执行 `pnpm db:setup:local`（需正确的 `MYSQL_ROOT_PASSWORD`）。

### API 报 `Cannot find module '../generated/prisma'`

```bash
pnpm prisma:generate
pnpm dev:api
```

---

## 可选：Docker MySQL（13306）

与 Homebrew 3306 隔离，适合不想动本机 MySQL 时：

1. `apps/api/.env` 改为 `mysql://pet:pet@127.0.0.1:13306/pet`
2. `pnpm db:setup`（需 Docker 拉取 mysql 镜像）
3. `pnpm db:connect:docker` 进入容器内 MySQL
