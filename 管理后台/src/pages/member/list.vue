<template>
	<view class="member-container">
    <LanguageSwitch />
		<!-- 搜索区域 -->
		<view class="search-box">
			<el-input
				v-model="searchPhone"
				:placeholder="$t(&quot;请输入手机号搜索&quot;)"
				clearable
				style="width: 300px"
				@keyup.enter="handleSearch"
			>
				<template #prefix>
					<el-icon><Search /></el-icon>
				</template>
			</el-input>
			<el-button type="primary" @click="handleSearch">{{ $t("搜索") }}</el-button>
			<el-button @click="handleReset">{{ $t("重置") }}</el-button>
		</view>

		<!-- 运营工具栏 -->
		<view class="ops-toolbar">
			<view class="ops-item" @tap="goToPage('/pages/coupon/list')">
				<uni-icons type="ticket" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("优惠券") }}</text>
			</view>
			<view class="ops-item" @tap="goToPage('/pages/card/list')">
				<uni-icons type="card" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("储值卡") }}</text>
			</view>
			<view class="ops-item" @tap="goToPage('/pages/points/list')">
				<uni-icons type="gift" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("积分商城") }}</text>
			</view>
			<view class="ops-item" @tap="goToPage('/pages/banner/list')">
				<uni-icons type="image" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("轮播图") }}</text>
			</view>
			<view class="ops-item" @tap="goToPage('/pages/qrcode/list')">
				<uni-icons type="scan" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("二维码") }}</text>
			</view>
			<view class="ops-item" @tap="goToPage('/pages/store/setting')">
				<uni-icons type="location" size="32" color="#ADB838"></uni-icons>
				<text class="ops-label">{{ $t("门店设置") }}</text>
			</view>
		</view>

		<!-- 会员表格 -->
		<view class="table-box">
			<el-table :data="memberList" v-loading="loading" stripe>
				<el-table-column prop="nickname" :label="$t(&quot;昵称&quot;)" min-width="120" />
				<el-table-column prop="phone" :label="$t(&quot;手机号&quot;)" min-width="120" />
				<el-table-column prop="points" :label="$t(&quot;积分&quot;)" min-width="100" sortable>
					<template #default="{ row }">
						{{ $t(row.points || 0) }}
					</template>
				</el-table-column>
				<el-table-column prop="balance" :label="$t(&quot;余额&quot;)" min-width="100" sortable>
					<template #default="{ row }">
						¥{{ $t(formatMoney(row.balance)) }}
					</template>
				</el-table-column>
				<el-table-column prop="createTime" :label="$t(&quot;注册时间&quot;)" min-width="160">
					<template #default="{ row }">
						{{ $t(formatDate(row.createTime)) }}
					</template>
				</el-table-column>
				<el-table-column :label="$t(&quot;操作&quot;)" fixed="right" width="200">
					<template #default="{ row }">
						<el-button link type="primary" @click="handleAdjustPoints(row)">{{ $t("调整积分") }}</el-button>
						<el-button link type="success" @click="handleAdjustBalance(row)">{{ $t("调整余额") }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</view>

		<!-- 分页 -->
		<view class="pagination-box">
			<el-pagination
				v-model:current-page="pagination.page"
				v-model:page-size="pagination.pageSize"
				:total="pagination.total"
				:page-sizes="[10, 20, 50, 100]"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handlePageChange"
			/>
		</view>

		<!-- 调整积分对话框 -->
		<el-dialog v-model="pointsDialogVisible" :title="$t(&quot;调整积分&quot;)" width="400px">
			<el-form :model="pointsForm" label-width="80px">
				<el-form-item :label="$t(&quot;会员&quot;)">
					<el-input v-model="pointsForm.nickname" disabled />
				</el-form-item>
				<el-form-item :label="$t(&quot;当前积分&quot;)">
					<el-input :value="pointsForm.currentPoints" disabled />
				</el-form-item>
				<el-form-item :label="$t(&quot;调整积分&quot;)">
					<el-input-number
						v-model="pointsForm.adjustValue"
						:min="-999999"
						:max="999999"
						controls-position="right"
					/>
				</el-form-item>
				<el-form-item :label="$t(&quot;备注&quot;)">
					<el-input v-model="pointsForm.remark" :placeholder="$t(&quot;请输入备注&quot;)" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="pointsDialogVisible = false">{{ $t("取消") }}</el-button>
				<el-button type="primary" @click="confirmAdjustPoints" :loading="submitting">{{ $t("确认") }}</el-button>
			</template>
		</el-dialog>

		<!-- 调整余额对话框 -->
		<el-dialog v-model="balanceDialogVisible" :title="$t(&quot;调整余额&quot;)" width="400px">
			<el-form :model="balanceForm" label-width="80px">
				<el-form-item :label="$t(&quot;会员&quot;)">
					<el-input v-model="balanceForm.nickname" disabled />
				</el-form-item>
				<el-form-item :label="$t(&quot;当前余额&quot;)">
					<el-input :value="'¥' + formatMoney(balanceForm.currentBalance)" disabled />
				</el-form-item>
				<el-form-item :label="$t(&quot;调整金额&quot;)">
					<el-input-number
						v-model="balanceForm.adjustValue"
						:min="-999999"
						:max="999999"
						:precision="2"
						controls-position="right"
					/>
				</el-form-item>
				<el-form-item :label="$t(&quot;备注&quot;)">
					<el-input v-model="balanceForm.remark" :placeholder="$t(&quot;请输入备注&quot;)" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="balanceDialogVisible = false">{{ $t("取消") }}</el-button>
				<el-button type="primary" @click="confirmAdjustBalance" :loading="submitting">{{ $t("确认") }}</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script setup>
import { t } from '@/locale'

import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { adminRequest, formatDate, formatMoney } from '@/utils/api.js'
import { goPage } from '@/utils/navigate.js'

// 搜索
const searchPhone = ref('')
const loading = ref(false)
const memberList = ref([])

// 分页
const pagination = reactive({
	page: 1,
	pageSize: 10,
	total: 0
})

// 调整积分对话框
const pointsDialogVisible = ref(false)
const pointsForm = reactive({
	userId: '',
	nickname: '',
	currentPoints: 0,
	adjustValue: 0,
	remark: ''
})

// 调整余额对话框
const balanceDialogVisible = ref(false)
const balanceForm = reactive({
	userId: '',
	nickname: '',
	currentBalance: 0,
	adjustValue: 0,
	remark: ''
})

const submitting = ref(false)

// 获取会员列表
async function fetchMembers() {
	loading.value = true
	try {
		const res = await adminRequest('getMembers', {
			keyword: searchPhone.value,
			page: pagination.page,
			pageSize: pagination.pageSize
		})
		memberList.value = Array.isArray(res) ? res : []
		pagination.total = memberList.value.length
	} catch (e) {
		ElMessage.error(t(e.message || '获取会员列表失败'))
	} finally {
		loading.value = false
	}
}

// 搜索
function handleSearch() {
	pagination.page = 1
	fetchMembers()
}

// 重置
function handleReset() {
	searchPhone.value = ''
	pagination.page = 1
	fetchMembers()
}

// 分页
function handleSizeChange() {
	pagination.page = 1
	fetchMembers()
}

function handlePageChange() {
	fetchMembers()
}

// 调整积分
function handleAdjustPoints(row) {
	pointsForm.userId = row._id || row.id
	pointsForm.nickname = row.nickname
	pointsForm.currentPoints = row.points || 0
	pointsForm.adjustValue = 0
	pointsForm.remark = ''
	pointsDialogVisible.value = true
}

async function confirmAdjustPoints() {
	submitting.value = true
	try {
		const points = Math.abs(Number(pointsForm.adjustValue || 0))
		await adminRequest('adjustPoints', {
			member_id: pointsForm.userId,
			type: Number(pointsForm.adjustValue) >= 0 ? 'increase' : 'decrease',
			points,
			reason: pointsForm.remark
		})
		ElMessage.success(t('积分调整成功'))
		pointsDialogVisible.value = false
		fetchMembers()
	} catch (e) {
		ElMessage.error(t(e.message || '积分调整失败'))
	} finally {
		submitting.value = false
	}
}

// 调整余额
function handleAdjustBalance(row) {
	balanceForm.userId = row._id || row.id
	balanceForm.nickname = row.nickname
	balanceForm.currentBalance = row.balance || 0
	balanceForm.adjustValue = 0
	balanceForm.remark = ''
	balanceDialogVisible.value = true
}

async function confirmAdjustBalance() {
	submitting.value = true
	try {
		const amount = Math.abs(Number(balanceForm.adjustValue || 0))
		await adminRequest('adjustBalance', {
			member_id: balanceForm.userId,
			amount,
			type: Number(balanceForm.adjustValue) >= 0 ? 'increase' : 'decrease'
		})
		ElMessage.success(t('余额调整成功'))
		balanceDialogVisible.value = false
		fetchMembers()
	} catch (e) {
		ElMessage.error(t(e.message || '余额调整失败'))
	} finally {
		submitting.value = false
	}
}

onMounted(() => {
	fetchMembers()
})

function goToPage(url) {
	goPage(url)
}
</script>

<style scoped>
.member-container {
	padding: 20rpx;
}

.search-box {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.ops-toolbar {
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-around;
	align-items: center;
}

.ops-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.ops-label {
	font-size: 22rpx;
	color: #666;
}

.table-box {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
}

.pagination-box {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-top: 20rpx;
	display: flex;
	justify-content: flex-end;
}
</style>
