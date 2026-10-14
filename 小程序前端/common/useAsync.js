/**
 * useAsync — 统一异步四态组合式函数
 * status: idle | loading | empty | error | success
 * 用法：const { status, data, error, run } = useAsync(() => api.getMenuData())
 */
import { ref } from 'vue'

export function useAsync(loader, options = {}) {
	const status = ref('idle')
	const data = ref(options.initialValue || null)
	const error = ref(null)

	async function run(...args) {
		status.value = 'loading'
		error.value = null
		try {
			const result = await loader(...args)
			data.value = result
			const isEmpty = Array.isArray(result) && result.length === 0
			status.value = isEmpty ? 'empty' : 'success'
			return result
		} catch (err) {
			console.error('[useAsync]', err)
			error.value = err
			status.value = 'error'
			if (!options.silent) {
				uni.showToast({
					title: (err && err.message) || '加载失败，请重试',
					icon: 'none',
					duration: 2500
				})
			}
			throw err
		}
	}

	return { status, data, error, run, reload: run }
}

export default useAsync
