'use strict'
/**
 * 种子数据插入云函数（普通格式，非 cloud object）
 * 用法：uniCloud 控制台环境变量设 SEED_ENABLED=true → HBuilderX 右键云端运行
 * 运行一次后关闭 SEED_ENABLED，生产环境拒绝执行
 */
exports.main = async (event, context) => {
	// 生产环境保护：必须显式设置 SEED_ENABLED=true 才允许执行
	const v = typeof process.env === 'object' && process.env.SEED_ENABLED ? String(process.env.SEED_ENABLED).trim().toLowerCase() : ''
	if (!['true', '1', 'yes'].includes(v)) {
		return { code: 403, msg: 'seed 云函数已被生产环境保护。请在 uniCloud 环境变量设置 SEED_ENABLED=true 后初始化，完成后立即关闭。' }
	}
	const db = uniCloud.database()

	// 防重复：检查是否已有分类数据
	const existingCats = await db.collection('goods-category').count()
	if (existingCats.total > 0) {
		return { code: -1, msg: `数据库已有 ${existingCats.total} 条分类数据，跳过插入` }
	}

	// 1. 插入分类
	const catNames = ['招牌热麦', '特调饮品', '小食配饮', '新品尝鲜']
	const catIds = []
	for (let i = 0; i < catNames.length; i++) {
		const res = await db.collection('goods-category').add({
			name: catNames[i],
			sort: i + 1,
			is_show: true
		})
		catIds.push(res.id)
	}

	// 2. 插入商品
	const goodsList = [
		{ idx: 0, name: '招牌热麦包',     price: '18.00', original_price: '22.00', desc: '招牌现烤热麦包，外皮酥脆，内馅丰富',       image: 'https://picsum.photos/seed/bread1/400/400', stock: 500, sales: 128 },
		{ idx: 0, name: '芝士熏鸡热麦',   price: '22.00', original_price: '26.00', desc: '咸香熏鸡肉搭配浓郁芝士',                   image: 'https://picsum.photos/seed/bread2/400/400', stock: 300, sales:  89 },
		{ idx: 0, name: '紫薯麻薯包',     price: '16.00', original_price: '',       desc: '天然紫薯粉制作，口感绵软',                 image: 'https://picsum.photos/seed/bread3/400/400', stock: 400, sales:  67 },
		{ idx: 1, name: '草莓云朵蛋糕',   price: '28.00', original_price: '32.00', desc: '新鲜草莓现切，搭配进口芝士奶盖',           image: 'https://picsum.photos/seed/drink1/400/400', stock: 999, sales: 245 },
		{ idx: 1, name: '芋泥波波奶茶',   price: '22.00', original_price: '',       desc: '手捣芋泥 + Q弹波波，层次丰富',             image: 'https://picsum.photos/seed/drink2/400/400', stock: 999, sales: 312 },
		{ idx: 1, name: '杨枝甘露',       price: '25.00', original_price: '',       desc: '芒果西柚椰浆，清爽甜蜜',                   image: 'https://picsum.photos/seed/drink3/400/400', stock: 999, sales: 198 },
		{ idx: 1, name: '生椰拿铁',       price: '24.00', original_price: '',       desc: '冷萃咖啡 + 菲诺生椰乳',                   image: 'https://picsum.photos/seed/drink4/400/400', stock: 999, sales: 156 },
		{ idx: 2, name: '薯条小食套餐',   price: '12.00', original_price: '',       desc: '现炸薯条 + 番茄酱，经典搭配',             image: 'https://picsum.photos/seed/food1/400/400',  stock: 800, sales:  88 },
		{ idx: 2, name: '鸡米花小食',     price: '15.00', original_price: '18.00', desc: '香脆鸡米花，份量十足',                     image: 'https://picsum.photos/seed/food2/400/400',  stock: 600, sales:  73 },
		{ idx: 2, name: '芝士培根焗饭',   price: '32.00', original_price: '',       desc: '米饭铺满培根和芝士，烤制金黄',             image: 'https://picsum.photos/seed/food3/400/400',  stock: 200, sales:  45 },
		{ idx: 3, name: '茉莉奶绿（新品）', price: '19.00', original_price: '',     desc: '茉莉花茶 + 牛奶，清香不腻（新品尝鲜价）', image: 'https://picsum.photos/seed/drink5/400/400', stock: 999, sales:  12 },
		{ idx: 3, name: '牛油果旧识（新品）', price: '26.00', original_price: '',   desc: '牛油果奶昔，微甜顺滑（新品尝鲜价）',       image: 'https://picsum.photos/seed/drink6/400/400', stock: 999, sales:   8 }
	]
	for (const g of goodsList) {
		await db.collection('goods').add({
			category_id:    catIds[g.idx],
			name:           g.name,
			price:          g.price,
			original_price: g.original_price || '',
			description:    g.desc,
			image:          g.image,
			is_sell:        true,
			stock:          g.stock,
			sales:          g.sales
		})
	}

	// 3. 插入门店
	await db.collection('store').add({
		name:              '热麦点餐（示范店）',
		address:           '北京市朝阳区建国路88号SOHO现代城',
		tel:               '010-88888888',
		lat:               '39.908823',
		lng:               '116.456785',
		min_price:         '15.00',
		packing_fee:       '1.00',
		delivery_fee:      '5.00',
		server_time:       '09:00-22:00',
		is_open:           true,
		is_eat:            true,
		is_takeout:        true,
		notice:            '新客首单满30减5元，欢迎光临！',
		avg_delivery_time: 30
	})

	// 4. 插入轮播图
	const banners = [
		{ title: '新品上市 · 茉莉奶绿',   image: 'https://picsum.photos/seed/banner1/750/400', sort: 1 },
		{ title: '会员专享 · 满30减5',     image: 'https://picsum.photos/seed/banner2/750/400', sort: 2 },
		{ title: '招牌热麦包 · 限时特惠', image: 'https://picsum.photos/seed/banner3/750/400', sort: 3 }
	]
	for (const b of banners) {
		await db.collection('banner').add({
			title: b.title, image: b.image, link: '', sort: b.sort, is_show: true
		})
	}

	return {
		code: 0,
		msg: '种子数据插入成功',
		data: {
			categories: catIds.length,
			goods: goodsList.length,
			store: 1,
			banners: banners.length,
			category_ids: catIds
		}
	}
}
