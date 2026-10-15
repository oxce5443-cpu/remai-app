<template>
	<view class="qrcode-list-container">
    <LanguageSwitch />
		<!-- 搜索栏 -->
		<view class="search-bar">
			<button class="add-btn" @click="openGenerateDialog">{{ $t("生成二维码") }}</button>
		</view>

		<!-- 表格 -->
		<view class="table-container">
			<el-table :data="tableData" border style="width: 100%">
				<el-table-column prop="table_no" :label="$t(&quot;桌号&quot;)" width="120" />
				<el-table-column prop="qrcode" :label="$t(&quot;二维码&quot;)" width="120">
					<template #default="{ row }">
						<image v-if="row.qrcode" :src="row.qrcode" class="qrcode-image" @click="previewImage(row.qrcode)" />
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="status" :label="$t(&quot;状态&quot;)" width="100">
					<template #default="{ row }">
						<el-tag :type="row.status === 'active' ? 'success' : 'info'">
							{{ $t(row.status === 'active' ? '启用' : '禁用') }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="createTime" :label="$t(&quot;创建时间&quot;)" width="180">
					<template #default="{ row }">
						{{ $t(formatDate(row.createTime)) }}
					</template>
				</el-table-column>
				<el-table-column :label="$t(&quot;操作&quot;)" width="220" fixed="right">
					<template #default="{ row }">
						<el-button v-if="row.status === 'active'" size="small" type="warning" @click="toggleStatus(row)">{{ $t("禁用") }}</el-button>
						<el-button v-else size="small" type="success" @click="toggleStatus(row)">{{ $t("启用") }}</el-button>
						<el-button size="small" type="danger" @click="handleDelete(row)">{{ $t("删除") }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</view>

		<!-- 生成二维码弹窗 -->
		<el-dialog v-model="generateDialogVisible" :title="$t(&quot;生成二维码&quot;)" width="400px">
			<el-form :model="generateForm" label-width="80px">
				<el-form-item :label="$t(&quot;桌号&quot;)">
					<el-input v-model="generateForm.tableNo" :placeholder="$t(&quot;请输入桌号&quot;)" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="generateDialogVisible = false">{{ $t("取消") }}</el-button>
				<el-button type="primary" @click="handleGenerate" :loading="generateLoading">{{ $t("生成") }}</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script setup>
import { t } from '@/locale'
import { ref, onMounted } from 'vue'
import { adminRequest, formatDate } from '@/utils/api.js'

const tableData = ref([])
const generateDialogVisible = ref(false)
const generateLoading = ref(false)

const generateForm = ref({
	tableNo: ''
})

function normalizeQRCodeRow(item = {}) {
	const rawStatus = item.status || 'idle'
	return {
		...item,
		table_no: item.table_no || item.tableNo || '',
		qrcode: item.qrcode || item.file_url || item.file_id || '',
		createTime: item.createTime || item.created_at || item.createdAt || '',
		_rawStatus: rawStatus,
		status: rawStatus === 'inactive' || rawStatus === 'disabled' ? 'disabled' : 'active'
	}
}

// 加载数据
async function loadData() {
	try {
		const data = await adminRequest('getQRCodes')
		tableData.value = (data || []).map(normalizeQRCodeRow)
	} catch (e) {
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

// 打开生成弹窗
function openGenerateDialog() {
	generateForm.value.tableNo = ''
	generateDialogVisible.value = true
}

// 生成二维码
async function handleGenerate() {
	if (!generateForm.value.tableNo) {
		uni.showToast({ title: '请输入桌号', icon: 'none' })
		return
	}

	generateLoading.value = true
	try {
		await adminRequest('generateQRCode', { table_no: generateForm.value.tableNo })
		uni.showToast({ title: '生成成功', icon: 'success' })
		generateDialogVisible.value = false
		loadData()
	} catch (e) {
		uni.showToast({ title: e.message || '生成失败', icon: 'none' })
	} finally {
		generateLoading.value = false
	}
}

// 切换状态
async function toggleStatus(row) {
	const isActive = row.status === 'active'
	const newStatus = isActive ? 'inactive' : 'idle'
	const actionText = isActive ? '禁用' : '启用'

	try {
		await adminRequest('updateQRCodeStatus', { id: row._id, status: newStatus })
		uni.showToast({ title: `${actionText}成功`, icon: 'success' })
		loadData()
	} catch (e) {
		uni.showToast({ title: e.message || `${actionText}失败`, icon: 'none' })
	}
}

// 预览图片
function previewImage(url) {
	uni.previewImage({ urls: [url] })
}

// 删除
async function handleDelete(row) {
	uni.showModal({
		title: '确认删除',
		content: t('确定要删除桌号"{table}"的二维码吗？', { table: row.table_no || row.tableNo || '' }),
		success: async (res) => {
			if (res.confirm) {
				try {
					await adminRequest('deleteQRCode', { id: row._id })
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
.qrcode-list-container {
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

.qrcode-image {
	width: 60px;
	height: 60px;
	object-fit: cover;
	cursor: pointer;
}
</style>
