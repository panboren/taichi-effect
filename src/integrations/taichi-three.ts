// typescript
// 文件：src/integrations/taichi-three.ts

import * as THREE from 'three'
import { TaichiEffectEngine } from '../engine'

export interface TaichiThreeOptions {
  width?: number
  height?: number
  useOffscreen?: boolean
  appendToBody?: boolean
  planeSize?: { width: number; height: number }
  textureLinear?: boolean
  autoStart?: boolean
}

/**
 * Taichi <-> Three 桥接器
 * - init: 关联 Taichi 引擎与 Three 渲染上下文（scene/camera/renderer）
 * - step: 每帧调用以让 Taichi 渲染并同步纹理到 Three
 * - start/stop/dispose: 控制与清理
 */
export class TaichiThreeBridge {
  public taichiEngine?: TaichiEffectEngine
  public taichiCanvas!: HTMLCanvasElement | OffscreenCanvas
  public texture!: THREE.Texture
  public mesh?: THREE.Mesh
  public imageBitmap?: ImageBitmap

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.Camera
  private opts: Required<TaichiThreeOptions>
  private running = false

  constructor(opts: TaichiThreeOptions = {}) {
    this.opts = {
      width: opts.width ?? 512,
      height: opts.height ?? 512,
      useOffscreen: opts.useOffscreen ?? false,
      appendToBody: opts.appendToBody ?? false,
      planeSize: opts.planeSize ?? { width: 2, height: 2 },
      textureLinear: opts.textureLinear ?? true,
      autoStart: opts.autoStart ?? true,
    }
  }

  async init(
    taichiEngine: TaichiEffectEngine,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.taichiEngine = taichiEngine
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    const w = this.opts.width
    const h = this.opts.height

    // 创建 canvas 或 offscreen
    if (this.opts.useOffscreen && typeof OffscreenCanvas !== 'undefined') {
      this.taichiCanvas = new OffscreenCanvas(w, h)
    } else {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.style.display = 'none'
      if (this.opts.appendToBody) document.body.appendChild(c)
      this.taichiCanvas = c
    }

    // 将 canvas 传给 taichi 引擎（项目内 TaichiEffectEngine 构造/接口可能不同）
    // 尝试常见 API：setCanvas / attachCanvas / 构造时传参
    // 此处按常见模式调用 attachCanvas 或 setCanvas（若无，请在外部创建 engine 时直接传 canvas）
    try {
      if (typeof (this.taichiEngine as any).attachCanvas === 'function') {
        ;(this.taichiEngine as any).attachCanvas(this.taichiCanvas)
      } else if (typeof (this.taichiEngine as any).setCanvas === 'function') {
        ;(this.taichiEngine as any).setCanvas(this.taichiCanvas)
      }
    } catch {
      // 若引擎创建时已绑定 canvas，则忽略
    }

    // 纹理创建：优先使用 OffscreenCanvas + createImageBitmap 更新（避免 DOM 拷贝）
    const canUseImageBitmap = typeof createImageBitmap === 'function' && this.taichiCanvas instanceof OffscreenCanvas

    if (canUseImageBitmap) {
      this.texture = new THREE.Texture()
      // image 会在 step 中异步更新为 ImageBitmap
      this.texture.minFilter = this.opts.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      this.texture.magFilter = this.opts.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      this.texture.generateMipmaps = false
      this.texture.needsUpdate = true
    } else {
      // HTMLCanvasElement -> CanvasTexture 直接绑定
      const canvasEl = this.taichiCanvas as HTMLCanvasElement
      const canvasTex = new THREE.CanvasTexture(canvasEl)
      canvasTex.minFilter = this.opts.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      canvasTex.magFilter = this.opts.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      canvasTex.generateMipmaps = false
      canvasTex.needsUpdate = true
      this.texture = canvasTex
    }

    // 创建显示用 mesh（可修改为把 texture 应用到任意材质/模型）
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true })
    const geo = new THREE.PlaneGeometry(this.opts.planeSize.width, this.opts.planeSize.height)
    this.mesh = new THREE.Mesh(geo, mat)
    this.scene.add(this.mesh)

    if (this.opts.autoStart) this.start()
  }

  async step(time: number) {
    if (!this.taichiEngine) return

    // 1) 驱动 Taichi 引擎渲染（兼容常见方法名）
    if (typeof (this.taichiEngine as any).update === 'function') {
      ;(this.taichiEngine as any).update(time)
    } else if (typeof (this.taichiEngine as any).render === 'function') {
      ;(this.taichiEngine as any).render(time)
    }

    // 2) 同步纹理到 three
    if (this.taichiCanvas instanceof OffscreenCanvas && typeof createImageBitmap === 'function') {
      // 异步创建 ImageBitmap 并更新 texture.image
      try {
        const bitmap = await createImageBitmap(this.taichiCanvas)
        // 释放旧 bitmap
        if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
          try {
            ;(this.imageBitmap as any).close()
          } catch {}
        }
        this.imageBitmap = bitmap
        this.texture.image = bitmap
        this.texture.needsUpdate = true
      } catch (e) {
        // ignore
      }
    } else {
      // HTMLCanvasElement 直接标记需要更新
      if (this.texture instanceof THREE.CanvasTexture) {
        this.texture.needsUpdate = true
      } else {
        this.texture.image = (this.taichiCanvas as HTMLCanvasElement)
        this.texture.needsUpdate = true
      }
    }
  }

  start() {
    this.running = true
    // 若 Taichi 引擎有 start
    if (this.taichiEngine && typeof (this.taichiEngine as any).start === 'function') {
      ;(this.taichiEngine as any).start()
    }
    this._rafLoop()
  }

  stop() {
    this.running = false
    if (this.taichiEngine && typeof (this.taichiEngine as any).stop === 'function') {
      ;(this.taichiEngine as any).stop()
    }
  }

  private _rafLoop = (t?: number) => {
    if (!this.running) return
    const time = t ?? performance.now()
    // 外部可能需要在 step 后再 render；此处默认在 step 后立即 render（可按需改）
    this.step(time).then(() => {
      // 注意：不要干涉外部的渲染流程，如果需要统一渲染可开启下行
      // this.renderer.render(this.scene, this.camera)
      requestAnimationFrame(this._rafLoop)
    })
  }

  dispose() {
    this.stop()
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose())
      } else {
        this.mesh.material.dispose()
      }
    }
    if (this.texture) {
      this.texture.dispose()
    }
    if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
      try {
        ;(this.imageBitmap as any).close()
      } catch {}
    }
    // 如果 canvas 是挂到 DOM 上的，移除
    if (this.taichiCanvas instanceof HTMLCanvasElement && this.taichiCanvas.parentElement) {
      this.taichiCanvas.parentElement.removeChild(this.taichiCanvas)
    }
    // 停止/销毁 taichi 引擎（若有 stop/destroy）
    if (this.taichiEngine) {
      if (typeof (this.taichiEngine as any).stop === 'function') {
        ;(this.taichiEngine as any).stop()
      }
      if (typeof (this.taichiEngine as any).dispose === 'function') {
        ;(this.taichiEngine as any).dispose()
      }
    }
  }
}
