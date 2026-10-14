# REMAI 部署与发布检查清单 — 2026-10-14

**当前禁止按“编译成功”判断可收款上线。没有执行任何生产部署。** 本清单替代旧 README 中的密码算法、支付 v2 和新建空间建议。云服务是否过期尚无实际账单/控制台证据。

## 环境配置与账号

- [ ] 在 uniCloud 控制台核查现有空间 ID、所有者、地域、到期/续费、现有数据和备份。不要未经审批新建/替换空间或初始化生产数据库。
- [ ] dev/staging/prod 目前同一 spaceId。先安排隔离的预发空间，再联调；不以生产数据测试。
- [ ] 当前小程序公开 AppID 为源配置已有 `wxd608b92fed6a3f92`，已同步 manifest；须核查账号归属和商户绑定，不能因为格式正确认定可上线。
- [ ] 每个使用 uni-id 的业务云函数（uni-id/member/order/pay/cart/address/card/coupon/points）设置 **同一** `UNI_ID_TOKEN_SECRET`，至少 32 字符，使用安全随机 32 字节以上。公共模块配置现在从环境变量读取，未设置会拒绝签发/校验。
- [ ] 如果过去上线过源码中的内置 JWT 密钥，必须轮换并强制用户重新登录。历史 backup 含非空 AppSecret，若仍有效须轮换。不要把备份/zip/本地 env 上传 GitHub。
- [ ] `uni-id` 配 `WX_APPID`、`WX_APPSECRET`；`pay` 配同一 `WX_APPID`。AppSecret 只放云端，session_key 不返回客户端。
- [ ] `admin` 配 `ADMIN_USERNAME`、`ADMIN_PASSWORD_SALT`、`ADMIN_PASSWORD_HASH`、`ADMIN_TOKEN_SECRET`。真实代码密码算法是 **Node crypto.scryptSync(password, salt, 64).toString('hex')**，不是旧手册 sha256 迭代。固定 24 小时 token；旧 `ADMIN_HASH_ITERATIONS` / `ADMIN_TOKEN_EXPIRE_MS` 不被读取。使用自选强密码，不使用文档示例密码；离线生成哈希时避免 shell 历史/日志保存明文。
- [ ] H5 本地 `.env.*` 配 `VITE_UNICLOUD_PROVIDER`、`VITE_UNICLOUD_SPACE_ID`、`VITE_UNICLOUD_CLIENT_SECRET`。VITE 值被打包到浏览器，不能当作管理员认证秘密；管理员密码/签名密钥绝不能进入 VITE 变量。
- [ ] `SEED_ENABLED` 保持 false。若需要初始化空测试空间，须明确选择测试空间，并审查 seed 及字段类型后运行；本次未运行 seed。

## 支付与账务（P0 先完成）

- [ ] 支付落账已使用 startTransaction，将订单状态、所有库存、余额、积分和两类流水一起提交，流水采用确定性 ID，重复成功回调幂等返回。本地模型已测试重复、并发冲突重试和故障回滚。仍必须在真实阿里云空间验证事务冲突、容量限制、库存不足、取消竞争与商户通知重试；未通过不得上线。历史部分落账订单须单独对账，不能自动补扣。
- [ ] 修复下单事务和 request_id 幂等；同请求重放返回同订单，订单明细不能部分创建。
- [ ] 查微信商户号和小程序 AppID 的实际关联、支付资格、产品权限及结算状态。
- [ ] pay 云函数配 `WXPAY_MCH_ID`、`WXPAY_APIV3_KEY`（32 字节）、`WXPAY_MCH_SERIAL_NO`、`WXPAY_MCH_PRIVATE_KEY`、`WXPAY_PLATFORM_PUBLIC_KEY`、`WXPAY_PLATFORM_PUBLIC_KEY_ID`、`WXPAY_NOTIFY_URL`（HTTPS）。私钥、公钥 ID 和证书轮换要留运营流程。
- [ ] 按官方 URL 化配置启用 pay HTTP POST 地址；确认代理不修改原始 body，大小写签名头可用，成功返回 204，验签/落账失败返回 500；base64 输入已支持。必须商户环境验证。
- [ ] 下单 API 响应验签尚未实现；queryPayStatus 目前只查本地 DB。补微信主动查单、超时关单和对账任务，避免通知丢失留下永久 pending。
- [ ] 已付款不能从后台直接取消、标退款。真实退款接口、退款通知、重复退款和库存/余额恢复尚未实现，须独立联调。
- [ ] 在线充值已安全关闭，接入真实充值订单及付款通知后才能开放。不要恢复直接加余额路径。
- [ ] 支付确认未到达时显示确认中并保留购物车，不能展示支付成功或再次创建订单。
- [ ] Alipay 当前没有后端支付实现；manifest 平台段不是支付能力证据。本次不接入或承诺微信小程序内支付宝支付。

## 后端与安全

- [ ] 将本次 schema 修改在隔离空间审查并验证：服务器管理集合禁止客户端直接写，用户 token/session_key 隐藏；云函数 SDK 仍须独立鉴权。本次未上传 schema。
- [ ] 用户 JWT 校验已增加数据库 token 名单/status 检查；验证封禁/撤销、角色变更。客户端注销仍只清本地，需增加服务器注销或撤销端点。
- [ ] 所有遗留管理入口已拒绝；正常管理操作用 admin 云函数。QRcode 独立云函数拒绝访问，后台 QR 管理走 admin；完整多用户 RBAC 和不同门店隔离尚缺。
- [ ] 管理登录限流/锁定、操作审计日志、参数白名单、分页上限/查询性能、敏感错误处理尚需完善。
- [ ] common 模块 package 依赖已改为同目录部署模块；确认 HBuilderX 上传依赖完整。lock 文件保留历史依赖记录，云端安装需核对，不用旧依赖缓存覆盖新配置。
- [ ] 建备份、告警、日常订单支付对账、失败重试、回滚版本及操作值班流程。

## QR、菜单、购物车与餐具

- [ ] 统一 `qrcode`/`QRcode` 集合及 schema；目前大小写不一致仍存在。
- [ ] 实现可由服务器解析的 QR code ID、校验门店/桌号/码有效性；普通 query 和 scene 双路径、安全解码、桌号重置和跨店购物车隔离。仅信任客户端 table_no 不能上线。
- [ ] 餐具 0=无需餐具、1–5 份选项已接入，服务器允许 0–99 整数。确认客户详情/厨房后台收到正确字段，老订单“未记录”。
- [ ] 规格的合法选项和加价尚需服务端校验；菜单/收银显示费用与后端费用须一致，当前后端仍固定包装费/配送费为 0。
- [ ] 购物车 items 协议、缓存键和 ID 映射已修正；仍需多设备/登录合并、跨用户隔离、并发同步和删除中途失败测试。
- [ ] 每个首页 banner、商品推荐、菜单规格、订单按钮、账户和客服页面逐项用真实数据验收。会员权益、券包、发票、评价等扩展页面存在静态/未完成内容，不能声称全部交互可用。

## 小程序审查和真机测试

- [ ] 检查微信开发者工具正式 AppID、合法域名、URL 校验、基础库版本、隐私接口配置和后台隐私保护声明。现 manifest urlCheck=false 只适合开发，不是正式发布设置证据。
- [ ] 梳理实际收集数据（OpenID、头像、昵称、手机、地址、订单、session_key）、保留时长、注销删除及经营主体客服；完整隐私与用户协议需业务确认。
- [ ] 昵称头像按当前官方 chooseAvatar/昵称输入规则验收；现仍用 getUserProfile，不能保证新基础库返回真实资料。
- [ ] 最新编译产物在 `小程序前端/dist/build/mp-weixin`，不要提交根目录旧 mp-weixin 或 zip。本地 package 大小扫描约 1.33MB，但仍需开发者工具实际上传分析，不能当作官方包大小验收。
- [ ] 至少 iOS/Android 真机：登录/退出/过期、首次隐私授权、扫码冷/热启动、餐具、无网恢复、重复点击、支付取消/成功/通知延迟、库存变化、订单历史、店员履约和退款。
- [ ] H5 管理后台桌面/移动布局及全部管理页面、异常状态和权限分别验收。构建成功不证明 UI 或云端业务正确。
- [ ] 发布版本审批、代码/资源版权审查、审核材料、体验版验收、灰度和回滚；**任何生产部署必须另获明确批准**。

官方参考：[uniCloud HTTP](https://doc.dcloud.net.cn/uniCloud/http)、[schema](https://uniapp.dcloud.net.cn/uniCloud/schema)、[微信支付通知](https://pay.wechatpay.cn/doc/v3/merchant/4012791861)、[DCloud 文档源码](https://github.com/dcloudio/unidocs-unicloud-zh)。微信隐私/发行具体条款未全部在线读取和核实，属于发布前待办。
