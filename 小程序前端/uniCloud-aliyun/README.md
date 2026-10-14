> **2026-10-14 审计更新：当前 NOT READY。以下旧版部署步骤及通过声明仅为历史记录，不可作为上线依据。请优先阅读 `audit/2026-10-14/FINAL-ASSESSMENT.md` 与 `audit/2026-10-14/DEPLOYMENT-CHECKLIST.md`（相对项目根目录）。不要按旧文档新建云空间、灌生产数据或使用示例管理员密码。**

# 热麦点餐小程序 · 后端 + 管理端（分片 B）

本目录为整合工程**后端 + 管理后台重建分片**产物，与分片 A（小程序前端）合并构成完整项目。

## 交付目录

| 路径 | 内容 |
|------|------|
| `小程序前端/uniCloud-aliyun/cloudfunctions/` | 15 个云函数（一等公民，不可删除/降级） |
| `小程序前端/uniCloud-aliyun/database/` | 17 集合 schema（snake_case / 金额 number / avatar URL / 关键索引） |
| `管理后台/` | Vue3 + Vite + Element Plus + Pinia + ECharts H5 |
| `seed-data/` | 4 个种子 JSON + import-seed.js（确定性分类 id） |
| `scripts/verify-plan.mjs` | 65 项静态验证 |

## 云函数清单（15）

address / admin / banner / card / cart / coupon / goods / member / order / pay / points / QRcode / seed / store / uni-id

## 敏感配置：一律走 uniCloud 控制台环境变量

**代码零硬编码密钥，真实值在 uniCloud 控制台 → 云函数 → 环境变量配置，不得提交仓库。**

| 环境变量 | 用途 | 使用云函数 |
|----------|------|-----------|
| `ADMIN_USERNAME` | 管理员账号 | admin |
| `ADMIN_PASSWORD_HASH` | sha256(salt+password) 迭代哈希 | admin |
| `ADMIN_PASSWORD_SALT` | 随机盐 | admin |
| `ADMIN_HASH_ITERATIONS` | 哈希迭代次数（默认 10000） | admin |
| `ADMIN_TOKEN_SECRET` | HMAC-SHA256 token 签名密钥 | admin, QRcode |
| `ADMIN_TOKEN_EXPIRE_MS` | token 过期（默认 86400000） | admin |
| `WX_APPID` | 小程序 AppID | uni-id |
| `WX_APPSECRET` | 小程序 AppSecret | uni-id |
| `WXPAY_MCH_ID` | 微信支付商户号 | pay |
| `WXPAY_API_KEY` | 微信支付 API v2 密钥 | pay |
| `WXPAY_NOTIFY_URL` | 支付回调公网 URL | pay |
| `SEED_ENABLED` | seed 初始化开关（true 才允许跑） | seed |

管理后台 `.env.development` / `.env.production`：`VITE_UNICLOUD_SPACE_ID` / `VITE_UNICLOUD_CLIENT_SECRET` / `VITE_UNICLOUD_PROVIDER`。

## 部署步骤
1. HBuilderX 导入 `小程序前端` → 关联 uniCloud 空间
2. 上传 `database/*.schema.json`（建表+索引）
3. 上传 15 个云函数
4. uniCloud 控制台配置上述环境变量
5. 运行 seed（设置 `SEED_ENABLED=true`）→ 导入后关闭
6. `管理后台/`：`npm install && npm run build:h5`

## Known Issues（未实测）
- 云函数运行时行为（需上传云端实测）
- 微信支付统一下单 / notify 回调（需真实商户号 + 公网 URL）
- 管理端 `npm run build:h5` 构建（需 node_modules 安装后实测）
- uni-id createToken（依赖 uni-id-common 模块上传）
