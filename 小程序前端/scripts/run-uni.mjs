import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
const mode = args.includes('build') ? 'production' : 'development'
const local = { ...loadEnv(mode, root, ''), ...process.env }
let providers
try {
  // Explicit shell override wins; otherwise prefer the documented local VITE fields.
  // A legacy .env UNI_CLOUD_PROVIDER must not silently override .env.local.
  const explicit = process.env.UNI_CLOUD_PROVIDER
  const hasLocalAssociation = local.VITE_UNICLOUD_SPACE_ID || local.VITE_UNICLOUD_CLIENT_SECRET
  providers = explicit ? JSON.parse(explicit) : hasLocalAssociation ? [{
    provider: local.VITE_UNICLOUD_PROVIDER || 'aliyun',
    spaceId: local.VITE_UNICLOUD_SPACE_ID,
    clientSecret: local.VITE_UNICLOUD_CLIENT_SECRET
  }] : local.UNI_CLOUD_PROVIDER ? JSON.parse(local.UNI_CLOUD_PROVIDER) : []
} catch {
  console.error('UNI_CLOUD_PROVIDER must be a valid JSON array. Values were not logged.')
  process.exit(1)
}
if (!Array.isArray(providers) || providers.length !== 1 || !providers[0].spaceId || (providers[0].provider === 'aliyun' && !providers[0].clientSecret)) {
  console.error('Missing uniCloud client configuration. Copy .env.example to .env.local and configure VITE_UNICLOUD_SPACE_ID / VITE_UNICLOUD_CLIENT_SECRET, or bind the cloud space through HBuilderX. Do not use WX_APPSECRET or payment keys here.')
  process.exit(1)
}
const cli = path.join(root, 'node_modules/@dcloudio/vite-plugin-uni/bin/uni.js')
const child = spawn(process.execPath, [cli, ...args], {
  cwd: root,
  env: { ...process.env, UNI_INPUT_DIR: root, UNI_CLOUD_PROVIDER: JSON.stringify(providers) },
  stdio: 'inherit'
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('error', () => { console.error('Unable to start uni-app CLI. Run npm ci first.'); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
