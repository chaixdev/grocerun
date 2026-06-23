import { defineConfig, type PluginOption, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { oidcSpa } from 'oidc-spa/vite-plugin'
import path from 'node:path'

export default defineConfig({
  plugins: [
    oidcSpa() as PluginOption,
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true, routeFileIgnorePattern: '__tests__' }) as PluginOption,
    react() as PluginOption,
    tailwindcss() as PluginOption,
    {
      name: 'runtime-config',
      // Inject script tag into built index.html
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            attrs: { src: '/config.js' },
            injectTo: 'head-prepend' as const,
          },
        ];
      },
      // Dev mode: serve /config.js from Vite dev server so frontend works without Nest
      configureServer(server) {
        server.middlewares.use('/config.js', (_req, res) => {
          const env = loadEnv('development', process.cwd(), 'VITE_')
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-cache')
          const issuerUri = env.VITE_OIDC_ISSUER_URI ?? 'https://accounts.google.com'
          const isGoogle = (() => { try { return new URL(issuerUri).hostname === 'accounts.google.com' } catch { return false } })()
          const clientSecret = env.VITE_OIDC_CLIENT_SECRET ?? process.env.VITE_OIDC_CLIENT_SECRET ?? ''
          if (clientSecret && !isGoogle) {
            console.warn('[vite] VITE_OIDC_CLIENT_SECRET is set but issuer is not Google — secret will NOT be served to browser.')
          }
          const config = {
            clientId: env.VITE_OIDC_CLIENT_ID ?? process.env.VITE_OIDC_CLIENT_ID ?? '',
            issuerUri,
            ...(isGoogle && clientSecret ? { clientSecret } : {}),
          }
          res.end(`window.__GROCERUN_CONFIG__ = ${JSON.stringify(config)};`)
        })
      },
    } as PluginOption,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@grocerun/dto': path.resolve(__dirname, '../_shared/dtos/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // SSE stream must be proxied separately to avoid response buffering.
      // The default http-proxy behavior can buffer SSE responses, causing
      // the browser's EventSource to timeout after ~30s without receiving
      // heartbeats. Setting selfHandleResponse: false ensures the response
      // is streamed directly to the client.
      '/api/v1/sync/stream': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        selfHandleResponse: false,
      },
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /apps\/_shared\/dtos\/dist/],
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.0'),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_INVITATION_TIMEOUT_MINUTES': JSON.stringify(process.env.VITE_INVITATION_TIMEOUT_MINUTES || '1440'),
    // VITE_OIDC_CLIENT_ID and VITE_OIDC_CLIENT_SECRET are NOT defined here —
    // Vite automatically exposes VITE_ prefixed vars from .env files to the client.
    // Defining them via process.env would override the .env values with empty strings
    // when running via turbo, since turbo subprocesses don't inherit shell env vars.
  },
})
