import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  resolve: { dedupe: ['vue'] },
  server: {
    proxy: {
      // 代理 UniCloud HTTP API 请求，解决 CORS 问题
      // UniCloud HTTP API GET 格式: /{spaceId}/{云函数名}?action=xxx&...
      '/uniCloud': {
        target: 'https://api.bspapp.com',
        changeOrigin: true,
        rewrite: (path) => `/client/invoke${path}`,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Content-Type', 'application/json')
          })
        }
      }
    }
  }
})
