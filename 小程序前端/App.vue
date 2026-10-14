<script>
export default {
	onLaunch: function() {
		console.log('App Launch');
		if (this.$store && this.$store.commit) {
			this.$store.commit('LOAD_AUTH')
		}
		this.$store.dispatch('loadCart')
		this.setupGlobalErrorHandler()
	},
	onShow: function() {
		console.log('App Show');
	},
	onHide: function() {
		console.log('App Hide');
	},
	methods: {
		setupGlobalErrorHandler() {
			uni.onError((err) => {
				console.error('全局错误:', err)
				if (err.message && err.message.includes('timeout')) {
					uni.showToast({
						title: '网络请求超时，请稍后重试',
						icon: 'none',
						duration: 3000
					})
				} else {
					uni.showToast({
						title: '系统错误，请稍后重试',
						icon: 'none',
						duration: 3000
					})
				}
			})
		}
	}
};
</script>

<style lang="scss">
/* 全局字体：温柔纤细无衬线体，字重 300-400 */
page {
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
	font-weight: 350;
	-webkit-font-smoothing: antialiased;
}

@import '~@/static/style/app.scss';
</style>
