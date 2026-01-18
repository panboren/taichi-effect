import { loadEnv, type PluginOption } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { createHtmlPlugin } from 'vite-plugin-html'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { ConfigEnv } from 'vite'
import path from 'path'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const isBuild = mode === 'prod' || mode === 'test'

  return {
    base: env.VITE_BASE_PATH,
    plugins: [
      Vue(),
      VueJsx(),
      UnoCSS(),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'vue-i18n': ['useI18n']
          },
          {
            '@/hooks/web/useMessage': ['useMessage']
          },
          {
            '@/utils/auth': ['getAccessToken', 'setToken']
          }
        ],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: {
          enabled: false
        }
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/components.d.ts',
        extensions: ['vue', 'tsx'],
        include: [/\.vue$/, /\.vue\?vue/, /\.tsx$/],
        exclude: [/[\\/]node_modules[\\/]/, /[\\/]\\.git[\\/]/, /[\\/]\\.nuxt[\\/]/]
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
        inject: 'body-last',
        customDomId: '__svg__icons__dom__'
      }),
      createHtmlPlugin({
        minify: true,
        template: 'index.html'
      }),
      vueI18n({
        strictMessage: false,
        include: [path.resolve(__dirname, './src/locales/**')]
      }) as PluginOption,
      // Gzip 压缩
      viteCompression({
        verbose: true,
        disable: !isBuild,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz'
      }),
      // Brotli 压缩（比 gzip 更好）
      viteCompression({
        verbose: true,
        disable: !isBuild,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br'
      }),
      // 打包体积分析
      isBuild &&
        visualizer({
          open: false,
          gzipSize: true,
          brotliSize: true,
          filename: 'dist/stats.html'
        })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
      },
      // 依赖预构建优化
      optimizeDeps: {
        include: [
          'vue',
          'vue-router',
          'pinia',
          'element-plus',
          '@element-plus/icons-vue',
          'axios',
          'dayjs'
        ]
      }
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 5173,
      open: env.VITE_OPEN === 'true',
      hmr: {
        overlay: true
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/variables.scss" as *;',
          javascriptEnabled: true
        }
      }
    },
    build: {
      target: 'es2015',
      outDir: env.VITE_OUT_DIR || 'dist',
      assetsDir: 'assets',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      minify: 'terser',
      // CSS 代码分割
      cssCodeSplit: true,
      // 启用 Rollup 的 treeshaking
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: true
        },
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          // 优化 chunk 分割，减小首屏加载体积
          manualChunks: (id) => {
            // node_modules 中的包单独打包
            if (id.includes('node_modules')) {
              // Vue 核心库
              if (id.includes('vue')) {
                return 'vue-vendor'
              }
              // Vue Router
              if (id.includes('vue-router')) {
                return 'vue-router'
              }
              // Pinia
              if (id.includes('pinia')) {
                return 'pinia'
              }
              // Element Plus
              if (id.includes('element-plus') || id.includes('@element-plus')) {
                return 'element-plus'
              }
              // ECharts
              if (id.includes('echarts')) {
                return 'echarts'
              }
              // 图标库
              if (id.includes('@iconify')) {
                return 'icons'
              }
              // 工具库
              if (
                id.includes('lodash-es') ||
                id.includes('dayjs') ||
                id.includes('axios') ||
                id.includes('mitt') ||
                id.includes('crypto-js') ||
                id.includes('jsencrypt')
              ) {
                return 'utils'
              }
              // 编辑器
              if (id.includes('@wangeditor')) {
                return 'editor'
              }
              // 国际化
              if (id.includes('vue-i18n') || id.includes('@intlify')) {
                return 'i18n'
              }
              // 其他第三方库
              return 'vendor'
            }
            // 业务代码按模块分割
            if (id.includes('/src/views/')) {
              const match = id.match(/\/src\/views\/([^/]+)\//)
              if (match) {
                return `views-${match[1]}`
              }
            }
            // API 模块单独打包
            if (id.includes('/src/api/')) {
              return 'api'
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      // 优化模块加载
      moduleIds: 'deterministic'
    },
    // 构建优化
    reportCompressedSize: true,
    maxModuleSize: {
      warningLimit: 500
    }
  }
}
