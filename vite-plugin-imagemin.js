/**
 * Vite 图片压缩插件
 * 自动压缩构建产出的图片资源
 */

import { createRequire } from 'module'
import imagemin from 'imagemin'
import imageminWebp from 'imagemin-webp'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminSvgo from 'imagemin-svgo'

const require = createRequire(import.meta.url)

/**
 * Vite 图片压缩插件
 */
export default function viteImagemin(options = {}) {
  const {
    gifsicle = true,
    optipng = true,
    pngquant = true,
    svgo = true,
    jpegtran = true
  } = options

  return {
    name: 'vite-plugin-imagemin',
    apply: 'build',
    closeBundle: async () => {
      const outDir = options.outDir || 'dist'
      
      try {
        await imagemin([`${outDir}/**/*.{jpg,jpeg,png,gif,svg}`], {
          destination: outDir,
          plugins: [
            jpegtran && imageminMozjpeg({ quality: 80 }),
            pngquant && imageminPngquant({ quality: [0.6, 0.8] }),
            imageminSvgo({
              plugins: [
                { name: 'removeViewBox', active: false },
                { name: 'removeEmptyAttrs', active: false }
              ]
            })
          ].filter(Boolean)
        })

        // 生成 WebP 格式（更小）
        await imagemin([`${outDir}/**/*.{jpg,jpeg,png}`], {
          destination: outDir,
          plugins: [
            imageminWebp({ quality: 75 })
          ]
        })

        console.log('\x1b[32m%s\x1b[0m', '图片压缩完成')
      } catch (error) {
        console.error('图片压缩失败:', error)
      }
    }
  }
}
