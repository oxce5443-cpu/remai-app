# seed-data 种子数据

首次初始化数据库时使用。

## 文件说明
- `1-goods-category.json`：4 个商品分类（确定性 `_id`：cat_signature / cat_drinks / cat_snacks / cat_new）
- `2-goods.json`：12 个商品（`category_id` 直接引用上述确定性 _id，无需人工替换）
- `3-store.json`：1 个门店
- `4-banner.json`：3 张轮播图
- `import-seed.js`：幂等导入脚本（按 _id upsert）

## 使用方式

### 方式一：云函数 seed（推荐开发阶段）
1. uniCloud 控制台设置环境变量 `SEED_ENABLED=true`
2. 云端运行 `seed` 云函数
3. 完成后关闭 `SEED_ENABLED`

### 方式二：导入脚本
```bash
export UNICLOUD_SPACE_ID=你的空间ID
export UNICLOUD_CLIENT_SECRET=你的Web端clientSecret
node seed-data/import-seed.js
```

## 注意
- 金额字段已归一为 number（元）
- 分类 _id 为确定性字符串，便于 goods 引用与本地联调
- picsum.photos 图片为占位图，生产环境应替换为门店实拍
