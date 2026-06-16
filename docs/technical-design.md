# 小流浪城市地图 — 技术方案

> 基于产品功能脑图的技术架构设计，面向 iOS / Android 双端 App 及配套后端服务。

---

## 1. 项目概述

### 1.1 产品定位

「小流浪城市地图」是一款以**城市地图**为核心交互载体的流浪动物救助协作平台，连接普通市民、救助者、志愿组织与品牌方，覆盖「发现 → 救助 → 资助 → 云领养 → 领养」全链路。

### 1.2 核心能力域

| 域 | 模块 | 技术特征 |
|----|------|----------|
| 地图交互 | 地图主界面 | 地理空间查询、自定义 Marker、热力图图层 |
| 内容生产 | 上传与发现 | 多媒体上传、状态机、UGC 互动 |
| 交易 | 救助资金 | 支付、众筹、钱包、账本 |
| 情感连接 | 云领养 | 订阅、动态流、档案生成 |
| 社交网络 | 组织联动 | IM、活动、兴趣匹配 |
| 商业化 | 品牌公益 | 赞助标签、商城、任务积分 |
| 工具 | 辅助功能 | 多维筛选、推送、时间轴 |
| 专项 | 走失找回 | 地理围栏告警、线索聚合 |

### 1.3 设计原则

- **地图优先**：所有核心实体（动物、活动、站点、走失报告）均具备 Geo 属性，查询走 PostGIS。
- **状态可追溯**：动物救助状态、走失状态使用显式状态机，变更写入审计日志并驱动通知。
- **资金可审计**：平台钱包与第三方支付分账清晰，每笔流水可追溯至具体动物/众筹项目。
- **渐进交付**：MVP 先打通「地图 + 上报 + 状态跟踪」，支付与云领养等复杂模块分期上线。

---

## 2. 总体架构

### 2.1 逻辑架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (App)                              │
│  地图 SDK │ 业务页面 │ 本地缓存 │ 推送 SDK │ 支付 SDK            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────────┐
│                      API 网关 (Nginx / Kong)                     │
│              鉴权 │ 限流 │ 路由 │ TLS 终止                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  业务 API      │   │  实时服务      │   │  管理后台 API  │
│  (NestJS)     │   │  (WebSocket)  │   │  (NestJS)     │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据与中间件层                            │
│  PostgreSQL+PostGIS │ Redis │ 对象存储(OSS/COS) │ 消息队列       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   高德地图 API         微信/支付宝支付        极光/个推推送
   内容审核 API         短信/实名(可选)         CDN
```

### 2.2 部署拓扑（生产环境建议）

| 组件 | 方案 | 说明 |
|------|------|------|
| App | App Store / 各安卓商店 | 双端统一代码库 |
| API 服务 | 云主机 / K8s | 无状态水平扩展 |
| 数据库 | 托管 PostgreSQL | 开启 PostGIS 扩展，主从 + 定时备份 |
| 缓存 | 托管 Redis | Session、热点 Geo 缓存、排行榜 |
| 对象存储 | 阿里云 OSS / 腾讯云 COS | 图片、视频，配合 CDN |
| 消息队列 | Redis Stream / RabbitMQ | 异步通知、审核回调、档案生成 |
| 管理后台 | Web SPA | 运营审核、品牌合作、数据看板 |

---

## 3. 技术选型

### 3.1 客户端（App）

| 项 | 选型 | 理由 |
|----|------|------|
| 框架 | **React Native + Expo** | 双端一套代码；Expo 简化构建、OTA 热更新、推送与媒体能力 |
| 语言 | TypeScript | 类型安全，与后端共享部分类型定义 |
| 地图 | **高德地图 SDK** | 国内定位与 POI 准确；支持 Marker、热力图、地理围栏 |
| 状态管理 | Zustand + TanStack Query | 轻量全局状态 + 服务端数据缓存 |
| 导航 | Expo Router | 文件式路由，适配 Tab + Stack 结构 |
| 本地存储 | MMKV / SQLite | 离线草稿、已订阅动物缓存 |
| 推送 | 极光推送 JPush | 国内到达率高，支持厂商通道 |
| 支付 | 微信 SDK + 支付宝 SDK | 原生跳转，配合服务端验签 |

**备选**：若需同步发布微信小程序，可评估 **uni-app** 或 **Taro** 做 App + 小程序一体化，地图与支付需额外适配。

### 3.2 后端

| 项 | 选型 | 理由 |
|----|------|------|
| 框架 | **NestJS** | 模块化、依赖注入、适合中大型业务拆分 |
| 语言 | TypeScript | 与客户端类型共享（monorepo） |
| ORM | Prisma + 原生 PostGIS SQL | 常规 CRUD 用 Prisma；Geo 查询用 `$queryRaw` |
| 鉴权 | JWT + Refresh Token | 手机号/微信登录；短 Token + 长 Refresh |
| 实时 | Socket.io / ws | 动态 Feed、私信、走失区域广播 |
| 任务调度 | BullMQ | 定时推送、热力图聚合、成长档案生成 |
| API 文档 | Swagger (OpenAPI) | 前后端契约 |

### 3.3 数据存储

| 存储 | 用途 |
|------|------|
| PostgreSQL + PostGIS | 主业务数据、空间索引、事务 |
| Redis | 会话、Geo 缓存、排行榜、限流计数 |
| OSS/COS | 图片/视频；私有桶 + 签名 URL |
| Elasticsearch（二期） | 全文搜索、复杂筛选、运营分析 |

### 3.4 Monorepo 结构建议

```
pet/
├── apps/
│   ├── mobile/          # Expo App
│   ├── admin/           # 运营后台 (Next.js / Vue)
│   └── api/             # NestJS 主 API
├── packages/
│   ├── shared/          # 共享类型、常量、状态枚举
│   └── geo/             # Geo 工具函数
├── docs/                # 设计文档
└── docker-compose.yml   # 本地开发环境
```

---

## 4. 功能模块 → 技术实现映射

### 4.1 地图主界面（核心交互）

**需求**：当前定位、切换城市、地图上展示动物 Marker（未救助 / 已救助 / 已领养）、点击弹出信息卡片。

**实现要点**：

```typescript
// 视口 Geo 查询 — 后端核心接口
GET /api/v1/animals/map?bbox=lng1,lat1,lng2,lat2&status=&species=&page=1
```

- 客户端上报地图 `bbox`（可视区域边界），服务端 PostGIS `ST_MakeEnvelope` + `&&` 索引查询。
- Marker 按 `status` 映射不同图标与颜色；聚合层级 zoom < 12 时使用点聚合（服务端或客户端 supercluster）。
- 城市切换：维护 `cities` 表（中心点 + 默认 zoom），切换后重置 bbox 并刷新 Marker。
- 信息卡片：首屏返回摘要字段；详情懒加载 `GET /api/v1/animals/:id`。

### 4.2 模块一：上传与发现小流浪

**需求**：上传照片/描述/定位；分类与标签；状态流转；评论点赞；救助者动态 Feed。

**实现要点**：

- **多媒体上传**：客户端直传 OSS（STS 临时凭证）→ 回调确认 → 写入 `media_assets` 表。
- **内容审核**：图片接入阿里云/腾讯云内容安全 API，文本敏感词过滤，审核通过后才公开显示。
- **状态机**（`AnimalStatus`）：

```
DISCOVERED → CONTACTING → RESCUED → AT_VET → FOSTERING → ADOPTED
                ↓
            ABANDONED / DECEASED（终态，需说明）
```

- 状态变更仅 `rescuer`（认领救助者）或 `org_admin` 可操作；每次变更写入 `animal_status_logs` 并触发订阅推送。
- **互动**：评论/点赞复用统一 `interactions` 表（`target_type` + `target_id`）。
- **动态 Feed**：`animal_activities` 表记录状态变更、新评论等；WebSocket 推送 + 分页 REST 拉取。

### 4.3 模块二：救助资金支持

**需求**：微信/支付宝/平台钱包打赏；众筹项目；勋章与排行榜。

**实现要点**：

- **支付架构**：

```
用户发起支付 → 创建 PaymentOrder(pending)
            → 调起微信/支付宝
            → 异步回调(webhook)验签
            → 更新订单 + 写入 LedgerEntry
            → 更新动物/众筹已筹金额
```

- **平台钱包**：`wallets` + `ledger_entries` 双账本；余额变动仅通过 Ledger 服务写入，禁止直接 UPDATE 余额字段。
- **众筹**：`crowdfunding_projects` 关联动物，目标金额、截止时间、用途明细；超额/失败退款策略需产品确认。
- **勋章**：规则引擎（捐赠次数、救助次数等）→ 异步任务评估 → 写入 `user_badges`。
- **排行榜**：Redis Sorted Set 按城市维度维护周榜/月榜，定时从 DB 同步。

> **合规**：需办理 ICP、支付相关资质或与持牌第三方支付/公益平台合作；资金公示页面展示流水摘要。

### 4.4 模块三：云领养与情绪陪伴

**需求**：虚拟领养；每日图文/视频更新；云家长留言祝福；祝福墙；成长档案。

**实现要点**：

- `cloud_adoptions` 表：用户 ↔ 动物多对一（一动物可有多个云家长）。
- 救助者/组织发布 `care_updates`（每日动态）；云家长可评论、点赞、送祝福。
- **祝福墙**：`blessings` 表，可按动物聚合展示。
- **成长档案**：BullMQ 定时任务按 `animal_status_logs` + `care_updates` + `media_assets` 生成 PDF/HTML 档案，存 OSS 并提供分享链接。

### 4.5 模块四：社交与组织联动

**需求**：公益站/志愿点/热点打卡；活动发起与报名；兴趣匹配；组织主页；私信。

**实现要点**：

- **地图 POI**：`map_pois` 表（type: station | volunteer | hotspot），与动物共用 Geo 查询接口。
- **活动**：`events` 表含时间、地点、人数上限；`event_registrations` 报名；活动页嵌地图导航。
- **组织**：`organizations` + 成员角色；组织主页展示救助案例与活动历史。
- **兴趣匹配**：基于用户标签（`user_tags`）与行为（关注、救助物种）做简单协同过滤，二期可引入推荐服务。
- **私信**：`conversations` + `messages`；WebSocket 实时；接入内容审核。

### 4.6 模块五：品牌公益合作

**需求**：救助案例赞助标签；公益商城；任务积分；品牌专题页。

**实现要点**：

- `brand_sponsorships` 关联品牌与动物/众筹/活动；前端展示「本救助由 XX 品牌支持」。
- **商城（二期）**：独立 `products` / `orders` 模块，或与有赞/微店 API 对接降低自建成本。
- **任务系统**：`tasks` + `user_task_progress`；完成分享、云领养体验等发放积分 `user_points`。
- 管理后台提供品牌入驻、素材配置、数据报表。

### 4.7 辅助功能

| 功能 | 实现 |
|------|------|
| 多维筛选 | 组合索引：species + status + ST_DWithin(距离) + 热度排序 |
| 订阅推送 | `subscriptions` 表；状态变更 → 消息队列 → JPush 按 device_token 推送 |
| 热力图 | 定时任务按网格聚合动物坐标 → Redis/表缓存 → 地图 SDK 热力图层 |
| 时间轴 | 由 `animal_status_logs` + `care_updates` + 关键互动自动拼装，只读 API |

### 4.8 走失宠物找回

**需求**：发布走失信息；区域提醒；线索留言；状态标签。

**实现要点**：

- `lost_pet_reports` 含最后目击 Geo + 时间 + 联系方式（脱敏展示）。
- **区域告警**：发布时 `ST_DWithin` 查附近 N km 内活跃用户 → 批量推送。
- **线索**：`lost_clues` 评论式结构，发布者可标记「有效线索」。
- **状态**：`SEARCHING → HAS_CLUE → FOUND`；找到后自动归档并可选生成感谢动态。

---

## 5. 核心数据模型

### 5.1 ER 关系概览

```
users ──┬── animals (creator / rescuer)
        ├── cloud_adoptions
        ├── donations / ledger_entries
        ├── interactions (comments, likes)
        ├── subscriptions
        └── organization_members

animals ──┬── media_assets
          ├── animal_status_logs
          ├── care_updates
          ├── crowdfunding_projects
          └── brand_sponsorships

organizations ── events ── event_registrations
map_pois (stations, hotspots)
lost_pet_reports ── lost_clues
```

### 5.2 关键表结构（摘要）

#### users

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| phone | VARCHAR | 手机号（唯一，脱敏存储） |
| nickname | VARCHAR | 昵称 |
| avatar_url | TEXT | 头像 |
| city_code | VARCHAR | 当前城市 |
| role | ENUM | user / rescuer / org_admin / admin |
| created_at | TIMESTAMPTZ | |

#### animals

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| creator_id | UUID | 上报人 |
| rescuer_id | UUID? | 认领救助者 |
| species | ENUM | cat / dog / other |
| status | ENUM | 状态机枚举 |
| location | GEOGRAPHY(POINT) | WGS84 坐标 |
| address_text | TEXT | 地址描述 |
| description | TEXT | 文字描述 |
| tags | JSONB | 健康、性别、性格等标签 |
| view_count | INT | 热度 |
| created_at / updated_at | TIMESTAMPTZ | |

> `location` 字段建 GIST 索引：`CREATE INDEX idx_animals_location ON animals USING GIST (location);`

#### ledger_entries（资金流水）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | |
| wallet_id | UUID | 关联钱包 |
| amount | DECIMAL | 正入负出 |
| type | ENUM | tip / crowdfunding / withdraw / refund |
| ref_type / ref_id | | 关联动物或众筹项目 |
| payment_order_id | UUID? | 第三方支付单 |
| created_at | TIMESTAMPTZ | 不可篡改 |

---

## 6. API 设计规范

### 6.1 通用约定

- Base URL：`https://api.example.com/api/v1`
- 鉴权：`Authorization: Bearer <access_token>`
- 分页：`?page=1&pageSize=20`，响应含 `{ data, meta: { total, page, pageSize } }`
- 错误码：HTTP 状态码 + 业务 `code`（如 `ANIMAL_NOT_FOUND`）
- Geo 坐标：统一 **WGS84**；客户端若从高德取 GCJ-02，入库前转换

### 6.2 核心接口清单（MVP + 扩展）

| 方法 | 路径 | 说明 | 阶段 |
|------|------|------|------|
| POST | /auth/sms/send | 发送验证码 | MVP |
| POST | /auth/login | 登录 | MVP |
| GET | /animals/map | 地图视口查询 | MVP |
| GET | /animals/:id | 动物详情 | MVP |
| POST | /animals | 上报动物 | MVP |
| PATCH | /animals/:id/status | 更新救助状态 | MVP |
| POST | /media/sts | 获取 OSS 上传凭证 | MVP |
| GET | /animals/:id/timeline | 救助时间轴 | MVP |
| POST | /interactions | 评论/点赞 | MVP |
| GET | /animals/:id/feed | 动态列表 | P1 |
| POST | /payments/tip | 发起打赏 | P1 |
| POST | /payments/webhook/wechat | 微信回调 | P1 |
| POST | /cloud-adoptions | 云领养 | P2 |
| GET | /events | 活动列表 | P2 |
| POST | /lost-pets | 发布走失 | P2 |
| GET | /map/heatmap | 热力图数据 | P2 |

### 6.3 WebSocket 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `animal:status_changed` | S→C | 订阅动物状态变更 |
| `animal:new_comment` | S→C | 新评论 |
| `lost:area_alert` | S→C | 附近走失告警 |
| `message:new` | S→C | 新私信 |

---

## 7. 第三方集成

| 服务 | 用途 | 集成方式 |
|------|------|----------|
| 高德地图 | 定位、地图展示、导航 | App SDK + 服务端 Web API（地理编码） |
| 阿里云 OSS | 图片视频存储 | STS 直传 + CDN |
| 微信开放平台 | 登录、支付、分享 | App SDK + 服务端 API |
| 支付宝 | 支付 | App SDK + 服务端 API |
| 极光推送 | App 推送 | SDK + REST API |
| 内容安全 | 图片/文本审核 | 服务端同步/异步审核 API |
| （可选）e 签宝 / 实名 | 众筹大额提现 | 二期 |

---

## 8. 安全与合规

### 8.1 安全

- 全链路 HTTPS；证书固定（可选，防中间人）。
- JWT 短有效期（15min）+ Refresh Token 轮换；设备绑定可选。
- OSS 私有读，URL 带过期签名；禁止客户端持有永久 AK/SK。
- 支付回调验签 + 幂等键防重复入账。
- 接口限流（Redis 滑动窗口）；敏感操作（状态变更、提现）二次验证。
- 日志脱敏：手机号、精确地址、联系方式按角色分级可见。

### 8.2 隐私与合规

- 《隐私政策》《用户协议》；首次启动明示收集项（位置、相册、相机）。
- 位置权限按需申请；列表页可模糊化精确坐标（偏移 50–200m）。
- 个人信息存储最小化；账号注销与数据删除流程。
- UGC 内容审核 + 举报/封禁机制。
- 涉及公开募捐需确认资质路径（慈善组织合作 or 限定为「个人救助打赏」模式）。

---

## 9. 非功能性需求

| 指标 | 目标 |
|------|------|
| 地图 Marker 加载 | 视口内 500 点 < 1s（P95） |
| API 响应 | 常规接口 P95 < 300ms |
| 可用性 | 99.9%（按月） |
| 图片上传 | 支持 9 张/次，单张 ≤ 10MB；自动压缩与 WebP |
| 并发 | 初期 1k DAU 可支撑；架构支持水平扩展 |
| 离线 | 上报草稿本地保存，网络恢复后重传 |

---

## 10. 分期实施路线

### Phase 0 — 工程基建（2 周）

- Monorepo 初始化、CI/CD、开发/测试环境
- PostgreSQL + PostGIS + Redis + OSS 联通
- 鉴权、用户体系、统一错误处理、Swagger

### Phase 1 — MVP（6–8 周）

**目标**：地图上看动物、上报、跟踪状态、基础互动

- 地图主界面 + Marker + 信息卡片
- 动物上报（图/文/定位/标签）
- 状态机 + 时间轴 + 订阅推送
- 评论点赞
- 管理后台：内容审核、用户管理

**交付物**：TestFlight / 内测 APK

### Phase 2 — 资金与云领养（4–6 周）

- 微信/支付宝打赏 + 平台钱包
- 众筹项目
- 云领养、每日动态、祝福墙
- 勋章与排行榜

### Phase 3 — 社交与组织（4 周）

- 地图 POI（公益站、热点）
- 活动发起与报名
- 组织主页
- 私信

### Phase 4 — 品牌与走失（4 周）

- 品牌赞助与专题页
- 任务积分
- 走失发布与区域告警
- 热力图图层

### Phase 5 — 优化与规模化

- Elasticsearch 搜索
- 推荐算法
- 数据看板与 A/B
- 性能压测与多城市运营

---

## 11. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 支付/募捐合规 | 功能不可用或法律风险 | 早期明确业务模式，必要时仅做「定向打赏」 |
| 地图 SDK 费用与配额 | 成本超支 |  bbox 缓存、Marker 聚合、按需加载 |
| UGC 违规内容 | 下架风险 | 先发后审 + 举报 + 人工复核 |
| 虚假上报/骗捐 | 信任危机 | 救助者认证、组织背书、资金公示 |
| Geo 坐标隐私 | 隐私投诉 | 公开坐标模糊化，精确地址仅救助者可见 |

---

## 12. 本地开发环境

```yaml
# docker-compose.yml 核心服务
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: pet
      POSTGRES_USER: pet
      POSTGRES_PASSWORD: pet
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
# 启动流程（规划）
pnpm install
docker compose up -d
pnpm --filter api prisma migrate dev
pnpm --filter api dev
pnpm --filter mobile start
```

---

## 13. 相关文档

| 文档 | 说明 |
|------|------|
| [ui-design.md](./ui-design.md) | UI 设计规范 |
| [development-plan.md](./development-plan.md) | 开发计划（Sprint 任务与里程碑） |
| [admin-design.md](./admin-design.md) | Admin 管理系统规划 |

随项目推进，可在 `docs/` 下增量补充：

| 文档 | 时机 |
|------|------|
| `api-spec.openapi.yaml` | Phase 0 后期 |
| `database-schema.md` | 首版 Migration 完成后 |
| `deployment.md` | 上线前 |
| `permissions.md` | 角色权限定稿后 |

---

## 附录 A：动物状态枚举

```typescript
enum AnimalStatus {
  DISCOVERED   = 'discovered',    // 未救助
  CONTACTING   = 'contacting',    // 联系救助中
  RESCUED      = 'rescued',       // 已救助
  AT_VET       = 'at_vet',        // 已送医
  FOSTERING    = 'fostering',     // 等待领养
  ADOPTED      = 'adopted',       // 已领养
  DECEASED     = 'deceased',      // 已离世
  ABANDONED    = 'abandoned',     // 救助中止
}
```

## 附录 B：客户端页面结构（建议）

```
(app)
├── (tabs)
│   ├── map          # 地图主界面
│   ├── discover     # 发现/Feed
│   ├── publish      # 上报入口
│   ├── messages     # 消息
│   └── profile      # 我的
├── animal/[id]      # 动物详情
├── lost/[id]        # 走失详情
├── event/[id]       # 活动详情
└── org/[id]         # 组织主页
```
