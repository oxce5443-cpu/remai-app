const CACHE_EXPIRY = process.env.VUE_APP_CACHE_EXPIRY || 3600

class Cache {
  constructor() {
    this.prefix = 'remai_'
  }

  getKey(key) {
    return this.prefix + key
  }

  set(key, value, expiry = CACHE_EXPIRY) {
    try {
      const item = {
        value,
        expiry: Date.now() + expiry * 1000
      }
      uni.setStorageSync(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  get(key) {
    try {
      const itemStr = uni.getStorageSync(this.getKey(key))
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      if (Date.now() > item.expiry) {
        this.remove(key)
        return null
      }

      return item.value
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  remove(key) {
    try {
      uni.removeStorageSync(this.getKey(key))
    } catch (error) {
      console.error('Cache remove error:', error)
    }
  }

  clear() {
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          uni.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  has(key) {
    return this.get(key) !== null
  }

  getWithDefault(key, defaultValue) {
    const value = this.get(key)
    return value !== null ? value : defaultValue
  }
}

export default new Cache()