# CherryGo 农产品销售管理小程序

基于 Uni-app + Vue 3 + TypeScript + 微信云开发的农产品销售管理微信小程序。

## 项目简介

CherryGo 是一款专为家庭农产品（车厘子、枇杷等）设计的微信小程序，核心解决发货人统计汇总、照片存档、物流跟踪等问题，支持多角色协作。

## 核心功能

### P0 阶段（MVP）
- ✅ 用户认证与角色权限系统
- ✅ 商品管理与配置
- ✅ 订单创建与提交
- ✅ 发货人工作台
- ✅ 物流查询

### P1 阶段（增强功能）
- ✅ 订阅消息通知
- ✅ 物流历史曲线
- ✅ 授权分享功能

### P2 阶段（营销功能）
- ✅ 优惠券系统
- ✅ 邀请返利
- ✅ 数据统计看板

## 角色体系

| 角色 | 权限说明 |
|------|---------|
| 果园所有者 | 全局管理，配置商品、价格、优惠券，查看统计 |
| 填写人 | 订单CRUD，查看自己订单 |
| 发货人 | 接收订单，发货操作，查看订单 |
| 外部浏览者 | 查看商品和物流（需授权） |

## 技术栈

- **前端框架**: Uni-app + Vue 3 + TypeScript
- **状态管理**: Pinia
- **样式方案**: SCSS + CSS变量
- **后端服务**: 微信云开发（云数据库 + 云函数 + 云存储）
- **物流API**: 快递100

## 项目结构

```
CherryGo/
├── src/
│   ├── pages/                 # 页面目录
│   │   ├── index/            # 发货人工作台（首页）
│   │   ├── products/         # 商品相关页面
│   │   │   ├── list.vue      # 商品列表
│   │   │   ├── detail.vue    # 商品详情
│   │   │   └── config.vue    # 商品配置
│   │   ├── orders/           # 订单相关页面
│   │   │   ├── create.vue    # 创建订单
│   │   │   ├── detail.vue    # 订单详情
│   │   │   ├── logistics.vue # 物流跟踪
│   │   │   ├── ship.vue      # 发货操作
│   │   │   └── track.vue     # 物流查询
│   │   └── mine/             # 个人中心
│   ├── components/           # 组件目录
│   ├── stores/               # Pinia状态管理
│   ├── services/             # 业务服务层
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript类型定义
│   ├── styles/              # 公共样式
│   ├── cloudfunctions/      # 云函数目录
│   ├── App.vue              # 应用入口
│   └── main.ts              # 主入口文件
├── static/                  # 静态资源
├── pages.json               # 页面路由配置
├── manifest.json            # Uni-app配置
├── package.json             # 项目依赖
├── vite.config.ts          # Vite配置
└── tsconfig.json           # TypeScript配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置微信云开发

在 `manifest.json` 中配置您的微信云开发空间信息：

```json
{
  "uniCloud": {
    "provider": "tencent",
    "spaceId": "your-space-id",
    "secretKey": "your-secret-key",
    "secretId": "your-secret-id"
  }
}
```

### 3. 运行开发服务器

```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5
```

### 4. 构建生产版本

```bash
# 微信小程序
npm run build:mp-weixin
```

## 云函数部署

1. 在微信开发者工具中打开项目
2. 打开云开发控制台
3. 上传 `src/cloudfunctions/` 目录下的所有云函数
4. 初始化数据库集合（参考数据库设计文档）

## 数据库集合

- `users` - 用户表
- `products` - 产品表
- `orders` - 订单表
- `shipping_rules` - 邮费规则表
- `coupons` - 优惠券表
- `invites` - 邀请关系表
- `farms` - 农场配置表

## 核心页面说明

### 发货人工作台 (pages/index/index.vue)
- 顶部统计卡片（待发货数、今日发货、总订单）
- 规格汇总展示
- 订单列表（支持状态筛选）
- 快捷发货入口

### 订单创建 (pages/orders/create.vue)
- 三步骤流程：选择商品 → 填写地址 → 确认订单
- 实时计价（商品 + 运费 + 优惠）
- 收货地址自动填写

### 发货操作 (pages/orders/ship.vue)
- 订单信息展示
- 双照片上传（水果照片 + 订单截图）
- 自动添加时间水印
- 物流信息填写

## 开发规范

### 代码风格
- 使用 TypeScript 进行类型检查
- Vue 组件使用 `<script setup lang="ts">` 语法
- SCSS 使用 CSS 变量管理主题色

### 命名规范
- 组件文件：PascalCase (如 ProductCard.vue)
- 工具函数：camelCase (如 formatDate.ts)
- 云函数：kebab-case (如 get-products)

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
```

## 微信订阅消息配置

在微信公众平台配置订阅消息模板：
- 订单发货通知
- 物流状态更新
- 异常提醒

## 安全考虑

- ✅ 邀请返利仅限一级分销
- ✅ 敏感信息加密存储
- ✅ 每个云函数验证用户权限
- ✅ 订单创建频率限制

## 性能优化

- ✅ 图片压缩上传
- ✅ 列表分页加载
- ✅ 商品信息缓存
- ✅ 云函数查询优化

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。
