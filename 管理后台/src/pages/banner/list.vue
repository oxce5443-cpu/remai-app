<template>
	<view class="banner-list-container">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<button class="add-btn" @click="openDialog('add')">新增轮播图</button>
		</view>

		<!-- 表格 -->
		<view class="table-container">
			<el-table :data="tableData" border style="width: 100%">
				<el-table-column prop="title" label="标题" min-width="150" />
				<el-table-column prop="image" label="图片" width="120">
					<template #default="{ row }">
						<image v-if="row.image" :src="row.image" class="banner-image" @click="previewImage(row.image)" />
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="link" label="链接" min-width="200">
					<template #default="{ row }">
						<span v-if="row.link">{{ row.link }}</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="sort" label="排序" width="80" />
				<el-table-column label="操作" width="180" fixed="right">
					<template #default="{ row }">
						<el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
						<el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</view>

		<!-- 新增/编辑弹窗 -->
		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
			<el-form :model="form" label-width="100px">
				<el-form-item label="标题">
					<el-input v-model="form.title" placeholder="请输入标题" />
				</el-form-item>
				<el-form-item label="图片">
					<view class="upload-wrap">
						<image v-if="form.image" :src="form.image" class="preview-img" />
						<button v-if="!form.image" class="upload-btn" @click="chooseImage">选择图片</button>
						<el-button v-else type="danger" size="small" @click="form.image = ''">删除</el-button>
					</view>
				</el-form-item>
				<el-form-item label="链接">
					<el-input v-model="form.link" placeholder="请输入链接地址" />
				</el-form-item>
				<el-form-item label="排序">
					<el-input-number v-model="form.sort" :min="0" :precision="0" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminRequest } from '@/utils/api.js'

const tableData = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogType = ref('add')
const currentRow = ref(null)

const form = ref({
	title: '',
	image: '',
	link: '',
	sort: 0
})

const dialogTitle = computed(() => dialogType.value === 'add' ? '新增轮播图' : '编辑轮播图')

// 加载数据
async function loadData() {
	try {
		const data = await adminRequest('getBanners')
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

// 预览图片
function previewImage(url) {
	uni.previewImage({ urls: [url] })
}

// 打开弹窗
function openDialog(type, row = null) {
	dialogType.value = type
	if (type === 'edit' && row) {
		currentRow.value = row
		form.value = {
			title: row.title,
			image: row.image || '',
			link: row.link || '',
			sort: row.sort || 0
		}
	} else {
		currentRow.value = null
		form.value = {
			title: '',
			image: '',
			link: '',
			sort: 0
		}
	}
	dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
	if (!form.value.title) {
		uni.showToast({ title: '请输入标题', icon: 'none' })
		return
	}
	if (!form.value.image) {
		uni.showToast({ title: '请选择图片', icon: 'none' })
		return
	}

	submitLoading.value = true
	try {
		const action = dialogType.value === 'add' ? 'addBanner' : 'updateBanner'
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
		content: `确定要删除轮播图"${row.title}"吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					await adminRequest('deleteBanner', { id: row._id })
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
.banner-list-container {
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

.banner-image {
	width: 60px;
	height: 40px;
	object-fit: cover;
	cursor: pointer;
}

.upload-wrap {
	display: flex;
	align-items: center;
	gap: 10px;
}

.preview-img {
	width: 120px;
	height: 80px;
	object-fit: cover;
}

.upload-btn {
	width: 120px;
	height: 80px;
	line-height: 80px;
	text-align: center;
	background: #f5f5f5;
	border: 1px dashed #ddd;
	font-size: 12px;
	color: #999;
}
</style>