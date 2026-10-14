const LOG_LEVEL = process.env.VUE_APP_LOG_LEVEL || 'info'

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

class Logger {
  constructor() {
    this.level = levels[LOG_LEVEL] || levels.info
    this.prefix = '[Remai App]'
  }

  shouldLog(level) {
    return levels[level] >= this.level
  }

  log(level, ...args) {
    if (!this.shouldLog(level)) return

    const timestamp = new Date().toISOString()
    const logArgs = [`${this.prefix} [${level.toUpperCase()}] ${timestamp}`, ...args]

    switch (level) {
      case 'debug':
        console.debug(...logArgs)
        break
      case 'info':
        console.info(...logArgs)
        break
      case 'warn':
        console.warn(...logArgs)
        break
      case 'error':
        console.error(...logArgs)
        break
    }
  }

  debug(...args) {
    this.log('debug', ...args)
  }

  info(...args) {
    this.log('info', ...args)
  }

  warn(...args) {
    this.log('warn', ...args)
  }

  error(...args) {
    this.log('error', ...args)
    this.reportError(...args)
  }

  reportError(error, context = {}) {
    try {
      const errorInfo = {
        message: error.message || String(error),
        stack: error.stack || '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
        ...context
      }

      uni.request({
        url: process.env.VUE_APP_API_BASE_URL + '/api/logs/error',
        method: 'POST',
        data: errorInfo,
        header: {
          'Content-Type': 'application/json'
        },
        fail: (err) => {
          console.error('Failed to report error:', err)
        }
      })
    } catch (err) {
      console.error('Error reporting failed:', err)
    }
  }

  logApiRequest(url, method, params = {}, startTime) {
    const endTime = Date.now()
    const duration = endTime - startTime

    this.info(`API Request: ${method} ${url}`, {
      params,
      duration: `${duration}ms`
    })
  }

  logApiError(url, method, error) {
    this.error(`API Error: ${method} ${url}`, {
      error: error.message || String(error),
      stack: error.stack || ''
    })
  }
}

export default new Logger()