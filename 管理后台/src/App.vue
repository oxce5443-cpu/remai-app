<script setup>
import { onMounted } from 'vue'

onMounted(() => {
	// 检查登录状态
	const token = uni.getStorageSync('admin_token')
	if (!token) {
		uni.reLaunch({ url: '/pages/login/index' })
	}
})
</script>

<style lang="scss">
/* ===== 热麦烘焙 · 品牌设计系统变量 ===== */
@import './uni.scss';

/* ===== Element Plus 品牌主题覆盖（对齐既有 #B8855B/#4A3427 体系） ===== */
:root {
	/* 主色：焦糖金 #B8855B */
	--el-color-primary: #B8855B;
	--el-color-primary-light-3: #C9A17D;
	--el-color-primary-light-5: #D9B38C;
	--el-color-primary-light-7: #E8C9B0;
	--el-color-primary-light-8: #F0DCC8;
	--el-color-primary-light-9: #F8EDE0;
	--el-color-primary-dark-2: #96684A;

	/* 语义色暖调微调 */
	--el-color-success: #6B9E5E;
	--el-color-warning: #D4943A;
	--el-color-danger: #C75050;
	--el-color-error: #C75050;
	--el-color-info: #999188;

	/* 文字层级 */
	--el-text-color-primary: #332D27;
	--el-text-color-regular: #4A3427;
	--el-text-color-secondary: #665F57;
	--el-text-color-placeholder: #B8A890;

	/* 边框与填充 */
	--el-border-color: #EFE5D9;
	--el-border-color-light: #F0E6DA;
	--el-border-color-lighter: #F5EDE3;
	--el-fill-color-light: #F8F4EE;
	--el-fill-color-lighter: #FBF8F3;

	/* 圆角 */
	--el-border-radius-base: 6px;
	--el-border-radius-small: 4px;

	/* 页面背景 */
	--el-bg-color-page: #F8F4EE;
}

/* ===== 全局基础 ===== */
page {
	background-color: #F8F4EE;
	font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
	color: #332D27;
	-webkit-font-smoothing: antialiased;
}

.container {
	padding: 24rpx;
}

/* ===== 页面头部 ===== */
.page-header {
	background: #fff;
	padding: 32rpx;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 32rpx rgba(184, 133, 91, .12);
}

.page-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #4A3427;
	letter-spacing: 1rpx;
}

/* ===== Element Plus 组件轻量品牌化 ===== */

/* 卡片：柔和暖色阴影 */
.el-card {
	border: 1px solid #F0E6DA;
	border-radius: 10px;
	box-shadow: 0 4px 20px rgba(184, 133, 91, .08);
}

.el-card__header {
	font-weight: 600;
	color: #4A3427;
	border-bottom: 1px solid #F0E6DA;
}

/* 主色按钮：焦糖金 */
.el-button--primary,
.el-button--primary:visited {
	background-color: #B8855B !important;
	border-color: #B8855B !important;
	font-weight: 500;
}

.el-button--primary:hover,
.el-button--primary:focus {
	background-color: #C9A17D !important;
	border-color: #C9A17D !important;
}

.el-button--primary:active {
	background-color: #96684A !important;
	border-color: #96684A !important;
}

/* 危险按钮微调 */
.el-button--danger {
	background-color: #C75050;
	border-color: #C75050;
}

/* 表格 */
.el-table th.el-table__cell {
	background-color: #F8F4EE !important;
	color: #4A3427;
	font-weight: 600;
}

.el-table__body tr:hover > td.el-table__cell {
	background-color: #F5EDE3 !important;
}

/* 输入框聚焦 */
.el-input__wrapper.is-focus {
	box-shadow: 0 0 0 1px #B8855B inset !important;
}

/* 对话框 */
.el-dialog {
	border-radius: 12px;
}

.el-dialog__header {
	border-bottom: 1px solid #F0E6DA;
	margin-right: 0;
}

/* 标签 */
.el-tag {
	border-radius: 4px;
	font-weight: 500;
}

/* 消息提示 */
.el-message {
	border-radius: 8px;
}
</style>
