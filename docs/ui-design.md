# 小流浪城市地图 — UI 设计规范

> 基于 [technical-design.md](./technical-design.md) 功能模块，结合 UI/UX Pro Max 设计智能与移动端设计原则输出。

---

## 1. 设计定位

### 1.1 产品气质

| 维度 | 定义 |
|------|------|
| 情感 | 温暖、可信赖、有行动力——让用户感到「我可以帮上忙」 |
| 视觉 | 有机自然（Organic Biophilic）+ 无障碍友好（Accessible & Ethical） |
| 平台 | iOS 原生感优先，Expo 双端可落地 |
| 密度 | 偏低（Visual Density 3）——地图页留白，信息页层次清晰 |

**避免**：Claymorphism 过度圆角糖果风、紫蓝创业模板色、Dashboard 式卡片堆叠、Emoji 作图标。

### 1.2 设计原则（来自 UX 规范）

- 触控目标 ≥ 44×44pt，间距 ≥ 8dp
- 正文字号 ≥ 16px（iOS 防自动缩放）
- 每屏仅一个主 CTA
- 底部 Tab ≤ 5 项，图标 + 文字标签
- 状态不只靠颜色：未救助/已救助/已领养需图标 + 文字
- 加载 >300ms 显示 Skeleton，不用阻塞式全屏 Spinner
- 支持 `prefers-reduced-motion`

---

## 2. 设计系统（Design Tokens）

### 2.1 色彩

融合 **公益信任色** 与 **宠物友好暖色**，形成区别于通用 AI 配色的品牌识别。

| Token | 色值 | 用途 |
|-------|------|------|
| `--color-primary` | `#2D6A4F` | 主色：救助、确认、已救助状态 |
| `--color-primary-light` | `#40916C` | 主色悬停/渐变 |
| `--color-on-primary` | `#FFFFFF` | 主色上的文字 |
| `--color-secondary` | `#E07A5F` | 次要/警示：未救助、紧急 |
| `--color-accent` | `#F4A261` | 强调：云领养、打赏、希望 |
| `--color-info` | `#457B9D` | 已领养、信息提示 |
| `--color-background` | `#FAF7F2` | 页面底色（暖纸感） |
| `--color-surface` | `#FFFFFF` | 卡片、Sheet 表面 |
| `--color-foreground` | `#1A2E1A` | 主文字 |
| `--color-muted` | `#5C6B5C` | 次要文字 |
| `--color-border` | `#E8E4DC` | 分割线、边框 |
| `--color-destructive` | `#C1121F` | 删除、危险操作 |
| `--color-success` | `#2D6A4F` | 成功反馈 |
| `--color-map-overlay` | `rgba(26,46,26,0.06)` | 地图浮层蒙版 |

#### 地图 Marker 状态色

| 状态 | 颜色 | 图标语义 |
|------|------|----------|
| 未救助 | `#E07A5F` | 爪印 + 脉冲动画 |
| 联系救助中 | `#F4A261` | 爪印 + 时钟 |
| 已救助 | `#2D6A4F` | 爪印 + 对勾 |
| 等待领养 | `#457B9D` | 爪印 + 家 |
| 已领养 | `#6C757D` | 爪印 + 心（灰化） |

#### 深色模式（二期）

| Token | 色值 |
|-------|------|
| `--color-background` | `#0F1410` |
| `--color-surface` | `#1A221A` |
| `--color-foreground` | `#F0EDE6` |
| `--color-primary` | `#52B788` |

### 2.2 字体

中文为主的应用，采用系统字体保证性能与原生感：

| 角色 | iOS | Android | 字重 |
|------|-----|---------|------|
| 大标题 | PingFang SC | Noto Sans SC | Semibold 600 |
| 标题 | PingFang SC | Noto Sans SC | Medium 500 |
| 正文 | PingFang SC | Noto Sans SC | Regular 400 |
| 辅助 | PingFang SC | Noto Sans SC | Regular 400 |
| 数字/金额 | SF Pro Rounded / Tabular | Roboto | Medium 500 |

#### 字号阶梯（Type Scale）

| Token | 大小 | 行高 | 用途 |
|-------|------|------|------|
| `display-lg` | 28px | 34px | 欢迎页、空状态标题 |
| `display-md` | 24px | 30px | 页面标题 |
| `title-lg` | 20px | 26px | 卡片标题、动物名 |
| `title-md` | 17px | 22px | 列表项标题 |
| `body-lg` | 17px | 24px | 正文（iOS 默认） |
| `body-md` | 15px | 22px | 次要正文 |
| `label-md` | 13px | 18px | 标签、Caption |
| `label-sm` | 11px | 14px | 时间戳、Badge |

### 2.3 间距（4pt 网格）

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px | 图标与文字间距 |
| `space-2` | 8px | 紧凑元素间距 |
| `space-3` | 12px | 列表项内边距 |
| `space-4` | 16px | 卡片内边距、页面水平边距 |
| `space-5` | 20px | Section 间距 |
| `space-6` | 24px | 大 Section 间距 |
| `space-8` | 32px | 页面顶部留白 |
| `space-10` | 40px | Sheet 拖拽区上方 |

### 2.4 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 8px | 标签、小按钮 |
| `radius-md` | 12px | 输入框、Chip |
| `radius-lg` | 16px | 卡片 |
| `radius-xl` | 20px | Bottom Sheet 顶部 |
| `radius-full` | 9999px | 头像、FAB |

### 2.5 阴影与 elevation

| Level | 值 | 用途 |
|-------|-----|------|
| `elevation-0` | none | 平面列表 |
| `elevation-1` | `0 1px 3px rgba(26,46,26,0.08)` | 卡片 |
| `elevation-2` | `0 4px 12px rgba(26,46,26,0.10)` | 浮层卡片、FAB |
| `elevation-3` | `0 8px 24px rgba(26,46,26,0.12)` | Bottom Sheet |

### 2.6 图标

- 库：**Lucide React Native**（线性图标，stroke 1.75）
- 禁止 Emoji 作为功能图标
- Tab 图标：24×24pt，激活态 `--color-primary` 填充

---

## 3. 导航架构

```
┌─────────────────────────────────────┐
│           Stack Navigator           │
│  ┌───────────────────────────────┐  │
│  │        Tab Navigator (5)      │  │
│  │  地图 │ 发现 │ ＋ │ 消息 │ 我的 │  │
│  └───────────────────────────────┘  │
│  Modal: 上报流程 / 筛选 / 打赏       │
│  Sheet: 动物卡片预览 / 筛选器        │
└─────────────────────────────────────┘
```

| Tab | 图标 | 标签 | 说明 |
|-----|------|------|------|
| 地图 | `map-pin` | 地图 | 默认首页 |
| 发现 | `compass` | 发现 | Feed + 活动 |
| 上报 | `plus-circle` | — | 中心 FAB 样式，突出现实上报 |
| 消息 | `message-circle` | 消息 | 通知 + 私信 |
| 我的 | `user` | 我的 | 个人中心 |

**中心上报按钮**：直径 56pt，`--color-primary` 背景，白色 `plus` 图标，Tab 栏上方浮起 8pt。

---

## 4. 核心页面设计

### 4.1 地图主界面

**参考**：`docs/assets/screen-01-map.png`

```
┌──────────────────────────────┐
│ ▓ 状态栏                      │
│ ┌──────────────────────────┐ │
│ │ 📍 上海 ▾    🔍  🔥 筛选   │ │  ← 顶部栏：城市切换 + 搜索 + 筛选
│ └──────────────────────────┘ │
│                              │
│         [ 高德地图 ]          │
│     🐾(橙)  🐾(绿)  🐾(蓝)    │  ← 自定义 Marker
│                              │
│  ┌─ 定位 FAB ─┐              │
│  │     ⊕     │  ┌─ 图层 ─┐   │
│  └───────────┘  │  热力  │   │
│                 └────────┘   │
│ ┌──────────────────────────┐ │
│ │ 🐱 橘猫 · 500m · 未救助    │ │  ← 底部 Peek Sheet（可上滑展开）
│ │ [照片缩略图]  3条动态      │ │
│ └──────────────────────────┘ │
│  地图 │ 发现 │ ＋ │ 消息 │ 我的│
└──────────────────────────────┘
```

**交互**：
- 点击 Marker → 底部 Sheet 预览（Peek 高度 120pt）
- 上滑 Sheet → 进入动物详情（共享元素过渡：照片）
- 双指缩放 → Marker 聚合（zoom < 12）
- 长按地图空白 → 快捷上报（带定位钉）

**组件**：
- `MapHeader`：城市选择器（Sheet）、搜索入口
- `AnimalMarker`：SVG 爪印 + 状态色圆底
- `MapFilterChip`：物种/状态/距离横滑筛选
- `AnimalPeekSheet`：Bottom Sheet 半屏预览

### 4.2 动物详情页

**参考**：`docs/assets/screen-02-animal-detail.png`

**结构**（自上而下）：

1. **Hero 区**：全宽照片轮播（16:10），左上角返回，右上角分享/订阅
2. **信息区**：物种标签 + 名字/描述 + 状态进度条（6 步状态机可视化）
3. **标签行**：健康 / 性别 / 性格 Chip
4. **位置**：模糊地址 + 「导航」次要按钮
5. **动态 Feed**：时间轴式救助记录
6. **互动区**：评论列表
7. **固定底栏**：「打赏」次要 + 「联系救助者」/「更新状态」主按钮

**状态进度条**：

```
发现 → 联系 → 救助 → 送医 → 待领养 → 已领养
  ●────●────●────○────○────○
```

当前步骤高亮 `--color-primary`，已完成实心，未完成空心。

### 4.3 上报流程（Modal 多步）

**参考**：`docs/assets/screen-03-publish.png`

| 步骤 | 内容 | 验证 |
|------|------|------|
| 1/4 拍照 | 最多 9 张，相机/相册，首张为主图 | ≥1 张 |
| 2/4 描述 | 物种选择 + 文字描述 + 标签 Chip | 物种必选 |
| 3/4 定位 | 地图选点 + 地址确认，支持拖动 | 坐标必选 |
| 4/4 确认 | 预览卡片 + 发布 | — |

**UX**：
- 顶部步骤指示器（Step 1/4）
- 每步自动保存草稿（AsyncStorage）
- 关闭时若有内容 → 确认 Sheet
- 发布成功 → 轻 haptic + Toast + 跳转详情

### 4.4 发现页（Feed）

**参考**：`docs/assets/screen-04-discover.png`

**布局**：
- 顶部分段控件：`推荐` | `附近` | `活动`
- 推荐 Tab：双列瀑布流卡片（照片 + 状态 Badge + 距离）
- 附近 Tab：列表视图（左图右文，信息密度更高）
- 活动 Tab：横向日期选择 + 活动卡片（封面 + 时间地点 + 报名人数）

**卡片结构**：
```
┌─────────────────┐
│   [ 动物照片 ]    │
│ 未救助    1.2km  │
│ 橘猫 · 静安寺附近  │
│ ♡ 128  💬 12     │
└─────────────────┘
```

### 4.5 云领养页（P2）

- 顶部：已云领养的动物横向 Scroll
- 主体：「推荐云领养」大卡片列表
- 卡片含：照片、名字、救助者、云家长数、「成为云家长」按钮
- 详情：每日动态 Timeline + 祝福墙 + 成长档案入口

### 4.6 走失找回（P2）

- 地图层叠加走失 Marker（紫色 `#7B2CBF` 区别于流浪动物）
- 发布表单：宠物照片 + 品种 + 走失时间地点 + 联系方式（脱敏）
- 详情：线索留言区 + 「我看到了」快捷上报

### 4.7 个人中心

**参考**：`docs/assets/screen-05-profile.png`

```
┌──────────────────────────────┐
│  [头像]  昵称                  │
│  救助 3 · 云领养 2 · 捐赠 ¥128│
├──────────────────────────────┤
│  🏅 我的勋章                   │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐         │
│  │  │ │  │ │  │ │  │         │
│  └──┘ └──┘ └──┘ └──┘         │
├──────────────────────────────┤
│  我的上报                      │
│  我的云领养                    │
│  我的捐赠                      │
│  订阅的动物                    │
├──────────────────────────────┤
│  设置 · 帮助 · 关于            │
└──────────────────────────────┘
```

---

## 5. 组件库清单

| 组件 | 变体 | 说明 |
|------|------|------|
| `Button` | primary / secondary / ghost / danger | 高度 48pt，圆角 12px |
| `IconButton` | default / filled | 44×44 触控区 |
| `Chip` | filter / status / tag | 可关闭筛选 Chip |
| `Badge` | dot / count / status | 状态 Badge 带图标 |
| `Card` | elevated / flat / media | 媒体卡片用于 Feed |
| `Avatar` | sm / md / lg | 圆形，默认占位爪印 |
| `BottomSheet` | peek / half / full | @gorhom/bottom-sheet |
| `StatusStepper` | horizontal | 6 步救助状态 |
| `TimelineItem` | default | 动态 Feed 条目 |
| `EmptyState` | — | 插画 + 标题 + CTA |
| `Skeleton` | text / card / avatar | 加载占位 |
| `Toast` | success / error / info | 3s 自动消失 |
| `AnimalMarker` | 5 states | 地图专用 |

---

## 6. 动效规范

| 场景 | 类型 | 时长 | 曲线 |
|------|------|------|------|
| 按钮按压 | scale 0.97 | 100ms | ease-out |
| Sheet 展开 | translateY | 280ms | spring(damping:20) |
| 页面推入 | translateX | 300ms | ease-out |
| Marker 脉冲 | scale + opacity | 1500ms loop | ease-in-out |
| 状态变更 | 进度条填充 | 400ms | ease-out |
| Toast | fade + translateY | 200ms | ease-out |
| 列表入场 | stagger fade | 30ms/item | ease-out |

---

## 7. 无障碍检查清单

- [ ] 所有图标按钮有 `accessibilityLabel`
- [ ] 颜色对比度正文 ≥ 4.5:1
- [ ] 状态变更除颜色外有文字/图标
- [ ] 表单输入有关联 Label
- [ ] 支持 Dynamic Type 不截断关键信息
- [ ] 减少动画模式下降级为淡入淡出

---

## 8. 界面概念图

| 文件 | 页面 |
|------|------|
| [screen-01-map.png](./assets/screen-01-map.png) | 地图主界面 |
| [screen-02-animal-detail.png](./assets/screen-02-animal-detail.png) | 动物详情 |
| [screen-03-publish.png](./assets/screen-03-publish.png) | 上报流程 |
| [screen-04-discover.png](./assets/screen-04-discover.png) | 发现 Feed |
| [screen-05-profile.png](./assets/screen-05-profile.png) | 个人中心 |

---

## 9. 与技术方案对齐

| UI 模块 | 对应 API | 阶段 |
|---------|----------|------|
| 地图 Marker | `GET /animals/map` | MVP |
| 动物详情 | `GET /animals/:id` | MVP |
| 上报流程 | `POST /animals` + STS 上传 | MVP |
| 发现 Feed | `GET /animals` + 排序 | MVP |
| 打赏底栏 | `POST /payments/tip` | P1 |
| 云领养 | `POST /cloud-adoptions` | P2 |
| 走失 | `POST /lost-pets` | P2 |

---

## 10. 下一步

1. 在 `apps/mobile` 建立 Design Tokens（`theme/tokens.ts`）
2. 实现基础组件库（Button、Card、Sheet）
3. 地图页 + 详情页作为 MVP 首批落地页面
4. 设计评审后补充：登录/onboarding、打赏、消息页概念图
