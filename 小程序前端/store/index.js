import { createStore } from 'vuex'
import request, { api } from '@/api'

const CART_STORAGE_KEY = 'cart'

const store = createStore({
	state: {
		store: {},
		cart: [],
		orderType: 'takein',
		peopleNumber: 1,
		tableNo: uni.getStorageSync('remai_table_no') || '',
		address: {},
		addresses: [],
		token: uni.getStorageSync('uni_id_token') || '',
		member: uni.getStorageSync('member') || {},
		order: {}
	},
	getters: {
		isLogin: state => !!state.token && Object.keys(state.member || {}).length > 0,
		cartCount: state => state.cart.reduce((sum, item) => sum + (item.number || 0), 0),
		cartTotal: state => state.cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.number || 0), 0)
	},
	mutations: {
		LOAD_AUTH(state) {
			state.token = uni.getStorageSync('uni_id_token') || ''
			state.member = uni.getStorageSync('member') || {}
		},
		SET_TOKEN(state, token) {
			state.token = token || ''
			if (state.token) {
				uni.setStorageSync('uni_id_token', state.token)
				uni.setStorageSync('token', state.token)
			} else {
				uni.removeStorageSync('uni_id_token')
				uni.removeStorageSync('token')
			}
		},
		SET_ORDER_TYPE(state, type) {
			state.orderType = type
		},
		SET_TABLE_NO(state, no) {
			state.tableNo = String(no || '').trim()
			if (state.tableNo) {
				uni.setStorageSync('remai_table_no', state.tableNo)
			} else {
				uni.removeStorageSync('remai_table_no')
			}
		},
		SET_PEOPLE_NUMBER(state, number) {
			state.peopleNumber = number
		},
		SET_MEMBER(state, member) {
			state.member = member || {}
			if (member && Object.keys(member).length > 0) {
				uni.setStorageSync('member', member)
			} else {
				uni.removeStorageSync('member')
			}
		},
		LOGOUT(state) {
			state.token = ''
			state.member = {}
			state.cart = []
			uni.removeStorageSync('uni_id_token')
			uni.removeStorageSync('token')
			uni.removeStorageSync('member')
			uni.removeStorageSync(CART_STORAGE_KEY)
			state.address = {}
			state.order = {}
		},
		SET_ADDRESS(state, address) {
			state.address = address
		},
		SET_ADDRESSES(state, addresses) {
			state.addresses = addresses || []
		},
		SET_STORE(state, store) {
			state.store = store || {}
		},
		SET_CART(state, cart) {
			state.cart = Array.isArray(cart) ? cart : []
			uni.setStorageSync(CART_STORAGE_KEY, state.cart)
		},
		REMOVE_CART(state) {
			state.cart = []
			uni.removeStorageSync(CART_STORAGE_KEY)
		},
		SET_ORDER(state, order) {
			state.order = order || {}
		}
	},
	actions: {
		async getStore({ commit }) {
			const storeInfo = await request('store')
			commit('SET_STORE', storeInfo)
			return storeInfo
		},
		// 购物车：优先云端 cart 云函数，失败降级本地缓存（契约 §2 #12）
		async loadCart({ commit, state }) {
			// 未登录时直接读本地缓存
			if (!state.token) {
				const local = uni.getStorageSync(CART_STORAGE_KEY) || []
				commit('SET_CART', local)
				return local
			}
			try {
				const remote = await api.getCart()
				const rows = (remote && remote.goodsList) || (Array.isArray(remote) ? remote : [])
				const cart = rows.map(item => ({ ...item, id: item.goodsId, name: item.goodsName, number: item.number }))
				commit('SET_CART', cart)
				return cart
			} catch (e) {
				const local = uni.getStorageSync(CART_STORAGE_KEY) || []
				commit('SET_CART', local)
				return local
			}
		},
		async syncCart({ commit, state }) {
			if (!state.token) return
			try {
				await api.syncCart({ items: state.cart.map(item => ({ ...item, goodsId: item.id || item.goodsId, goodsName: item.name || item.goodsName })) })
			} catch (e) {
				// 云端同步失败不阻断本地购物车
				console.warn('[cart] sync failed, keep local:', e.message)
			}
		}
	}
})

uni.$on('remai-auth-expired', () => store.commit('LOGOUT'))

export default store
