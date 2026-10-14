# REMAI 初始生产审计 — 2026-10-14

结论：**NOT READY**。本报告以本地源代码和重新运行的检查为依据，不采信历史报告中的通过声明。尚未连接云控制台、微信商户平台或真机。用户确认没有 Git 仓库；GitHub connector 返回空仓库列表，后续只参考公开维护方资料。没有执行部署、初始化数据库或调用真实支付。

## 架构与认证

用户端：uni-app / Vue 3 / Vuex，29 个页面路由；四个主页面为 index、menu、orders、mine。API 层 `小程序前端/api/index.js` 负责 camelCase/snake_case 转换，使用 uniCloud.callFunction。后端 15 个云函数及 17 个 schema；管理 H5 使用 Vue 3、Element Plus、Pinia，所有正常管理页面统一调用 admin 云函数。另有 backup、mp-weixin、dist 和 zip 历史产物，不能视为可发布源码。

用户登录：`pages/login/login.vue:82` → uni.login 得 code → `api.loginByWeixin` → `cloudfunctions/uni-id/index.js:39` 向微信 jscode2session 发送 WX_APPID/WX_APPSECRET/code → 按 wx_openid.mp 查找/创建用户 → uni-id-common.createToken(uid) → 返回应用 JWT。OpenID 为身份标识；session_key 存数据库 weixin 字段，登录响应的白名单资料不包含 session_key。昵称头像为客户端提交，不应当作可信身份。

JWT：`cloudfunctions/common/uni-id-common/index.js` 的现有实现使用 HS256，包含 uid/role/permission/iat/exp；密钥从 uni-config-center 的 uni-id/config.json 读取。createToken 将 token 写入用户记录；checkToken 在正常有效期、role/permission 已携带时不总是读取用户记录，因此撤销、封禁及角色变更不能保证即时生效。近到期可产生刷新 token，但业务云函数未向客户端传递更新。用户端 `store/index.js:29` 将 token 同时存 uni_id_token/token，member 存本地；API 把 token 放 event.uniIdToken。不是微信 session_key，也不是微信支付私钥。LOGOUT 仅清本地，服务器 token 仍可用至过期。

管理登录：`管理后台/src/pages/login/index.vue:61` → admin.login → `admin/index.js:67` scrypt(password,salt,64) 与 ADMIN_PASSWORD_HASH 比较 → HMAC-SHA256 签署 base64 JSON（username/timestamp/expire），有效期固定 24 小时；H5 存 admin_token/admin_user，后续携带 event.admin_token。只有单个环境变量管理员账户，无完整多用户 RBAC、服务端注销或登录限流。VITE_UNICLOUD_CLIENT_SECRET 会进入浏览器产物，是 Web 云空间接入配置，不能替代管理员认证。

## 缺陷登记（修复前）

| 优先级 | 问题 | 文件/测试证据 | 影响 | 建议 |
|---|---|---|---|---|
| P0 | 分散管理 API 无鉴权 | order/index.js:245 起；member/index.js:134-138；goods/banner/store/card/coupon/points 的 actions；QRcode/index.js | 匿名读取订单/会员、改余额/库存/商品/状态；正常 admin 鉴权被绕过 | 关闭用户云函数中的遗留管理入口；管理端继续统一 admin |
| P0 | 无付款充值 | card/index.js:11-26，recharge 直接加余额 | 任意登录用户获取余额并消费 | 在真正支付充值订单和通知落账完成前拒绝充值 |
| P0 | 数据库直接写权限过宽 | orders.schema.json 的 update/delete=auth.uid!=null；uni-id-users 可自改整条记录；goods 等同样宽松 | JQL 可绕过业务云函数，自改余额/角色/订单 | 服务端拥有的集合禁客户端写；敏感用户字段禁读/写 |
| P0 | 签名密钥留在多个配置副本 | uniCloud-aliyun/common、cloudfunctions/common、uni_modules 下 uni-id/config.json 非空 tokenSecret | 拷贝上传或泄漏后可伪造令牌；副本不一致 | 移除内置签名密钥，统一云端环境变量；若实际使用需轮换 |
| P0 | 支付幂等和余额扣账无事务 | pay/index.js settlePaidOrder、deductOrderInventory、balancePay | 并发重复扣库、丢余额更新、部分失败后账本/积分缺失 | 云数据库事务、唯一支付流水和可恢复落账；必须云端并发验证 |
| P0 | 支付 URL 回调分发不完整 | pay/index.js 只 action==='notify'；handlePayNotify 返回普通对象 | 原生 HTTP POST 没 action，通知不会进入验签；HTTP 失败应答未明确定义 | 识别 URL 请求并正确返回 HTTP 状态；验证原始报文、商户/AppID/币种 |
| P1 | 管理员任意设置 paid/refunded | admin/index.js:338 | 未收款标支付/未退款标退款 | 仅允许履约状态转换，退款走真实 API |
| P1 | 缺餐具完整链路 | pay/createOrder 和 orders schema 无 cutlery；管理映射无字段 | 用户不能明确选择或厨房无法查看 | 前端选择→后端校验→存储→订单详情/管理显示 |
| P1 | QR 关联不可靠 | index.vue:189 解码 table_no；order 信任 table_no/qrcode_id，无 store_id；admin 使用 qrcode，schema 是 QRcode | 伪造桌号/旧桌号残留、门店错配、集合不一致 | 统一集合与服务端可验证 code/store/table |
| P1 | 下单不原子、无请求幂等 | order.createOrder 逐条写订单商品、无 request_id；数量允许小数；specs 不验证加价 | 重复订单、空/部分商品订单、错误计价 | 事务写入，幂等键，整数数量，服务端规格定价 |
| P1 | 购物车协议和缓存分裂 | store.syncCart 传 goodsList；cart.syncCart 只收 items；store 用 remai_cart，menu/pay 用 cart；num/number/id/goods_id 不一致 | 云端购物车静默不同步，用户间本地数据残留 | 单一数据契约和用户/门店缓存范围 |
| P1 | 登录传参被序列化后不一致 | API 将 userInfo→user_info；uni-id 只取 params.userInfo | 昵称头像丢失 | 服务端兼容 user_info，并使用资料白名单 |
| P1 | 用户端不识别 UNAUTHORIZED | api/index.js:172 只清 errCode===401；后端主要返回字符串 UNAUTHORIZED | 过期状态仍显示登录 | 清本地和 Vuex，识别真实错误码 |
| P1 | CLI 构建失败、微信 AppID 空 | build-mini-baseline.log 缺 src/manifest.json；manifest mp-weixin.appid=null；entry 4通过1失败 | 无法重现小程序构建/发布 | 配置 UNI_INPUT_DIR，明确有效 AppID |
| P1 | 文档指导错误及潜在破坏操作 | README 和工程报告指导新建云空间；旧 sha256 迭代与现 scrypt 不符、支付 v2 与现 v3 不符 | 登录无法配置、误建资源、遗漏支付配置 | 新部署手册覆盖旧操作；先核查空间再续费/关联 |
| P1 | UI存在伪成功和未实现操作 | pay.vue H5 dev 捕获支付失败仍标成功；login H5 造 token；getPackages 空；静态权益/折扣提示 | 误导用户，无法满足每个按钮可用 | 去除伪成功；缺功能明确错误/空态；逐页真机验收 |
| P2 | 性能/维护 | 订单列表 N+1、无一致分页上限；三份公共模块，历史产物混入；Sass 过期警告 | 放大调用量、部署错版本、维护困难 | 批量查询/分页、明确源码和发布目录、渐进样式更新 |

## 基线测试

- `node scripts/verify-plan.mjs`：60 通过，2 失败，exit 1。失败是旧 payment 符号检查；仅静态匹配，不证明运行正确。
- `node 小程序前端/scripts/verify-wechat-entry.mjs`：4 通过，1 失败（AppID）。
- `npm run build:mp-weixin`：失败，ENOENT src/manifest.json。
- 管理端构建已启动，结果另记。
- 未实测：云函数部署、DB 权限生效、支付/退款、扫描真实二维码、微信登录和全部真机 UI。阿里云是否过期/空间是否存在未知；历史文档的删除/新建声明未独立确认。

## 优先整改计划（先提交本报告，后修改）

1. 安全止血：遗留管理入口拒绝、未经付款充值拒绝、数据库写权限收紧、密钥环境变量化，加入执行云函数的攻击回归测试；保留正常 admin 管理路径。
2. 修复可重现构建与登录字段/错误码，修正文档的密码算法和部署说明；真实配置仍需运营侧提供。
3. 贯通餐具字段，校验订单类型和数量；QR、订单幂等、支付事务需可验证的云数据库语义与真实商户联调。
4. 测试驱动修复支付回调、状态机和购物车，再做四页真实数据交互及视觉验收；不改换框架或引入无关依赖。
5. 发布前真机/预发核查、隐私声明、域名/AppID/商户绑定、package 大小、监控/备份/回滚。没有足够证据不得升级 READY。

## 官方资料与 GitHub 参考

- DCloud schema：https://uniapp.dcloud.net.cn/uniCloud/schema
- DCloud 文档源码：https://github.com/dcloudio/unidocs-unicloud-zh
- DCloud 管理项目：https://github.com/dcloudio/uni-admin （参考架构，未替换本项目）
- 微信登录：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html （此次抓取失败，不能据此声称已核对完整内容）
- 微信支付通知：https://pay.wechatpay.cn/doc/v3/merchant/4012791861 （官方要求 POST、原始报文验签、解密及 HTTP 200/204 成功应答）
- 官方支付 SDK 示例：https://github.com/wechatpay-apiv3/wechatpay-php （仅参考协议，非本项目 Node 依赖）
