<template>
	<view class="card-list-container">
    <LanguageSwitch />
		<!-- 搜索栏 -->
		<view class="search-bar">
			<button class="add-btn" @click="openDialog('add')">{{ $t("新增套餐") }}</button>
		</view>

		<!-- 表格 -->
		<view class="table-container">
			<el-table :data="tableData" border style="width: 100%">
				<el-table-column prop="name" :label="$t(&quot;套餐名称&quot;)" min-width="150" />
				<el-table-column prop="amount" :label="$t(&quot;充值金额&quot;)" width="120">
					<template #default="{ row }">
						¥{{ $t(formatMoney(row.amount)) }}
					</template>
				</el-table-column>
				<el-table-column prop="gift_amount" :label="$t(&quot;赠送金额&quot;)" width="120">
					<template #default="{ row }">
						¥{{ $t(formatMoney(row.gift_amount)) }}
					</template>
				</el-table-column>
				<el-table-column prop="is_show" :label="$t(&quot;状态&quot;)" width="100">
					<template #default="{ row }">
						<el-tag :type="row.is_show ? 'success' : 'info'">
							{{ $t(row.is_show ? '启用' : '禁用') }}
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
				<el-form-item :label="$t(&quot;套餐名称&quot;)">
					<el-input v-model="form.name" :placeholder="$t(&quot;请输入套餐名称&quot;)" />
				</el-form-item>
				<el-form-item :label="$t(&quot;充值金额&quot;)">
					<el-input-number v-model="form.amount" :min="0" :precision="2" />
				</el-form-item>
				<el-form-item :label="$t(&quot;赠送金额&quot;)">
					<el-input-number v-model="form.gift_amount" :min="0" :precision="2" />
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
import { adminRequest, formatMoney } from '@/utils/api.js'

const tableData = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogType = ref('add')
const currentRow = ref(null)

const form = ref({
	name: '',
	amount: 0,
	gift_amount: 0,
	is_show: true,
	sort: 0
})

const dialogTitle = computed(() => dialogType.value === 'add' ? '新增套餐' : '编辑套餐')

// 加载数据
async function loadData() {
	try {
		const data = await adminRequest('getCardPackages')
		tableData.value = data || []
	} catch (e) {
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

// 打开弹窗
function openDialog(type, row = null) {
	dialogType.value = type
	if (type === 'edit' && row) {
		currentRow.value = row
		form.value = {
			name: row.name,
			amount: row.amount,
			gift_amount: row.gift_amount,
			is_show: row.is_show !== false,
			sort: row.sort || 0
		}
	} else {
		currentRow.value = null
		form.value = {
			name: '',
			amount: 0,
			gift_amount: 0,
			is_show: true,
			sort: 0
		}
	}
	dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
	if (!form.value.name) {
		uni.showToast({ title: '请输入套餐名称', icon: 'none' })
		return
	}
	if (form.value.amount <= 0) {
		uni.showToast({ title: '请输入正确的充值金额', icon: 'none' })
		return
	}

	submitLoading.value = true
	try {
		const action = dialogType.value === 'add' ? 'addCardPackage' : 'updateCardPackage'
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
		content: t('确定要删除套餐"{name}"吗？', { name: row.name }),
		success: async (res) => {
			if (res.confirm) {
				try {
					await adminRequest('deleteCardPackage', { id: row._id })
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
.card-list-container {
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
</style>
