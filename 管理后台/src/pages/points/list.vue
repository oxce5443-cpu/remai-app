<template>
	<view class="points-list-container">
    <LanguageSwitch />
		<!-- 搜索栏 -->
		<view class="search-bar">
			<button class="add-btn" @click="openDialog('add')">{{ $t("新增商品") }}</button>
		</view>

		<!-- 表格 -->
		<view class="table-container">
			<el-table :data="tableData" border style="width: 100%">
				<el-table-column prop="goods_name" :label="$t(&quot;商品名称&quot;)" min-width="150" />
				<el-table-column prop="points" :label="$t(&quot;所需积分&quot;)" width="120" />
				<el-table-column prop="stock" :label="$t(&quot;库存&quot;)" width="100" />
				<el-table-column prop="is_show" :label="$t(&quot;状态&quot;)" width="100">
					<template #default="{ row }">
						<el-tag :type="row.is_show ? 'success' : 'info'">
							{{ $t(row.is_show ? '上架' : '下架') }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column :label="$t(&quot;操作&quot;)" width="180" fixed="right">
					<template #default="{ row }">
						<el-button size="small" @click="openDialog('edit', row)">{{ $t("编辑") }}</el-button>
						<el-button size="small" type="danger" @click="handleDelete(row)">{{ $t("删除") }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</view>

		<!-- 新增/编辑弹窗 -->
		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
			<el-form :model="form" label-width="100px">
				<el-form-item :label="$t(&quot;商品名称&quot;)">
					<el-input v-model="form.goods_name" :placeholder="$t(&quot;请输入商品名称&quot;)" />
				</el-form-item>
				<el-form-item :label="$t(&quot;所需积分&quot;)">
					<el-input-number v-model="form.points" :min="0" :precision="0" />
				</el-form-item>
				<el-form-item :label="$t(&quot;库存&quot;)">
					<el-input-number v-model="form.stock" :min="0" :precision="0" />
				</el-form-item>
				<el-form-item :label="$t(&quot;商品图片&quot;)">
					<view class="upload-wrap">
						<image v-if="form.image" :src="form.image" class="preview-img" />
						<button v-if="!form.image" class="upload-btn" @click="chooseImage">{{ $t("选择图片") }}</button>
						<el-button v-else type="danger" size="small" @click="form.image = ''">{{ $t("删除") }}</el-button>
					</view>
				</el-form-item>
				<el-form-item :label="$t(&quot;状态&quot;)">
					<el-switch v-model="form.is_show" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">{{ $t("取消") }}</el-button>
				<el-button type="primary" @click="handleSubmit" :loading="submitLoading">{{ $t("确定") }}</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script setup>
import { t } from '@/locale'
import { ref, onMounted, computed } from 'vue'
import { adminRequest } from '@/utils/api.js'

const tableData = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogType = ref('add')
const currentRow = ref(null)

const form = ref({
	goods_name: '',
	points: 0,
	stock: 0,
	image: '',
	is_show: true,
	exchange_desc: '',
	sort: 0
})

const dialogTitle = computed(() => dialogType.value === 'add' ? '新增商品' : '编辑商品')

// 加载数据
async function loadData() {
	try {
		const data = await adminRequest('getPointsMall')
		tableData.value = data || []
	} catch (e) {
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

// 选择图片
function chooseImage() {
	uni.chooseImage({
		count: 1,
		success: (res) => {
			form.value.image = res.tempFilePaths[0]
		}
	})
}

// 打开弹窗
function openDialog(type, row = null) {
	dialogType.value = type
	if (type === 'edit' && row) {
		currentRow.value = row
		form.value = {
			goods_name: row.goods_name,
			points: row.points,
			stock: row.stock,
			image: row.image || '',
			is_show: row.is_show !== false,
			exchange_desc: row.exchange_desc || '',
			sort: row.sort || 0
		}
	} else {
		currentRow.value = null
		form.value = {
			goods_name: '',
			points: 0,
			stock: 0,
			image: '',
			is_show: true,
			exchange_desc: '',
			sort: 0
		}
	}
	dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
	if (!form.value.goods_name) {
		uni.showToast({ title: '请输入商品名称', icon: 'none' })
		return
	}
	if (form.value.points <= 0) {
		uni.showToast({ title: '请输入正确的积分', icon: 'none' })
		return
	}

	submitLoading.value = true
	try {
		const action = dialogType.value === 'add' ? 'addPointsGoods' : 'updatePointsGoods'
		const data = dialogType.value === 'add' ? form.value : { id: currentRow.value._id, ...form.value }
		await adminRequest(action, data)
		uni.showToast({ title: '操作成功', icon: 'success' })
		dialogVisible.value = false
		loadData()
	} catch (e) {
		uni.showToast({ title: e.message || '操作失败', icon: 'none' })
	} finally {
		submitLoading.value = false
	}
}

// 删除
async function handleDelete(row) {
	uni.showModal({
		title: '确认删除',
		content: t('确定要删除商品"{name}"吗？', { name: row.goods_name }),
		success: async (res) => {
			if (res.confirm) {
				try {
					await adminRequest('deletePointsGoods', { id: row._id })
					uni.showToast({ title: '删除成功', icon: 'success' })
					loadData()
				} catch (e) {
					uni.showToast({ title: e.message || '删除失败', icon: 'none' })
				}
			}
		}
	})
}

onMounted(() => {
	loadData()
})
</script>

<style scoped>
.points-list-container {
	padding: 20px;
}

.search-bar {
	margin-bottom: 20px;
}

.add-btn {
	width: 120px;
	background: #ADB838;
	color: #fff;
	border: none;
}

.table-container {
	background: #fff;
	border-radius: 8px;
	padding: 20px;
}

.upload-wrap {
	display: flex;
	align-items: center;
	gap: 10px;
}

.preview-img {
	width: 80px;
	height: 80px;
	object-fit: cover;
}

.upload-btn {
	width: 80px;
	height: 80px;
	line-height: 80px;
	text-align: center;
	background: #f5f5f5;
	border: 1px dashed #ddd;
	font-size: 12px;
	color: #999;
}
</style>
