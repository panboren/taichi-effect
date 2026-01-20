// typescript
// 文件：src/integrations/taichi-three.ts
import * as THREE from 'three'
import type { WebGLRenderer, Scene, Camera, Texture, Mesh, Material } from 'three'

export type Mode = 'canvas' | 'imageBitmap' | 'pixelBuffer'

export interface BridgeOptions {
  width?: number
  height?: number
  mode?: Mode
  appendToBody?: boolean
  planeSize?: { width: number; height: number }
  linear?: boolean
  autoStart?: boolean
  pixelBuffer?: { width?: number; height?: number; texture?: THREE.DataTexture }
  onError?: (e: any) => void
  onBeforeStep?: (t: number) => void
  onAfterStep?: (t: number) => void
}

type AnyEngine = any

export class TaichiThreeBridge {
  public engine?: AnyEngine
  public canvas!: HTMLCanvasElement | OffscreenCanvas
  public texture!: Texture
  public mesh?: Mesh
  public imageBitmap?: ImageBitmap
  public opts: Required<BridgeOptions>

  private renderer?: WebGLRenderer
  private scene?: Scene
  private camera?: Camera
  private running = false
  private raf = 0

  constructor(options: BridgeOptions = {}) {
    const defaultMode: Mode = (options.mode) ??
      (options.useOffscreen && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function'
        ? 'imageBitmap'
        : 'canvas') as Mode

    this.opts = {
      width: options.width ?? 512,
      height: options.height ?? 512,
      mode: options.mode ?? defaultMode,
      appendToBody: options.appendToBody ?? false,
      planeSize: options.planeSize ?? { width: 2, height: 2 },
      linear: options.linear ?? true,
      autoStart: options.autoStart ?? true,
      pixelBuffer: options.pixelBuffer ?? { width: options.width ?? 512, height: options.height ?? 512, texture: undefined },
      onError: options.onError ?? (() => {}),
      onBeforeStep: options.onBeforeStep ?? (() => {}),
      onAfterStep: options.onAfterStep ?? (() => {}),
    }
  }

  async init(engine: AnyEngine, renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    this.engine = engine
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    const w = this.opts.width
    const h = this.opts.height

    // create canvas/offscreen according to mode
    if (this.opts.mode === 'imageBitmap' && typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(w, h)
    } else {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.style.display = 'none'
      if (this.opts.appendToBody) document.body.appendChild(c)
      this.canvas = c
    }

    // try to bind canvas to engine
    try {
      if (this.engine) {
        if (typeof this.engine.attachCanvas === 'function') this.engine.attachCanvas(this.canvas)
        else if (typeof this.engine.setCanvas === 'function') this.engine.setCanvas(this.canvas)
      }
    } catch (e) {
      this.opts.onError(e)
    }

    // create texture based on mode
    if (this.opts.mode === 'pixelBuffer') {
      if (this.opts.pixelBuffer.texture) {
        this.texture = this.opts.pixelBuffer.texture
      } else {
        const sw = this.opts.pixelBuffer.width!
        const sh = this.opts.pixelBuffer.height!
        const arr = new Uint8Array(sw * sh * 4)
        const dt = new THREE.DataTexture(arr, sw, sh, THREE.RGBAFormat, THREE.UnsignedByteType)
        dt.minFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
        dt.magFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
        dt.generateMipmaps = false
        dt.needsUpdate = true
        this.texture = dt
      }
    } else if (this.opts.mode === 'imageBitmap' && typeof createImageBitmap === 'function' && this.canvas instanceof OffscreenCanvas) {
      const t = new THREE.Texture()
      t.minFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
      t.magFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
      t.generateMipmaps = false
      t.needsUpdate = true
      this.texture = t
    } else {
      const tex = new THREE.CanvasTexture(this.canvas as HTMLCanvasElement)
      tex.minFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
      tex.magFilter = this.opts.linear ? THREE.LinearFilter : THREE.NearestFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true
      this.texture = tex
    }

    // default mesh
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true })
    const geo = new THREE.PlaneGeometry(this.opts.planeSize.width, this.opts.planeSize.height)
    this.mesh = new THREE.Mesh(geo, mat)
    this.scene!.add(this.mesh)

    if (this.opts.autoStart) this.start()
    return this
  }

  async step(time = performance.now()) {
    if (!this.engine) return
    try {
      this.opts.onBeforeStep(time)
      if (typeof this.engine.update === 'function') this.engine.update(time)
      else if (typeof this.engine.render === 'function') this.engine.render(time)

      if (this.opts.mode === 'imageBitmap' && this.canvas instanceof OffscreenCanvas && typeof createImageBitmap === 'function') {
        try {
          const bmp = await createImageBitmap(this.canvas)
          if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
            try { (this.imageBitmap as any).close() } catch {}
          }
          this.imageBitmap = bmp
          ;(this.texture as THREE.Texture).image = bmp
          this.texture.needsUpdate = true
        } catch (e) {
          this.opts.onError(e)
        }
      } else if (this.opts.mode === 'canvas') {
        if (this.texture instanceof THREE.CanvasTexture) this.texture.needsUpdate = true
        else {
          (this.texture as THREE.Texture).image = this.canvas as HTMLCanvasElement
          this.texture.needsUpdate = true
        }
      }
      // pixelBuffer mode expects external updatePixelBufferFrom calls

      this.opts.onAfterStep(time)
    } catch (e) {
      this.opts.onError(e)
    }
  }

  start() {
    if (this.running) return
    this.running = true
    if (this.engine && typeof this.engine.start === 'function') this.engine.start()
    const loop = (t: number) => {
      if (!this.running) return
      this.step(t).then(() => {
        this.raf = requestAnimationFrame(loop)
      })
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    if (this.engine && typeof this.engine.stop === 'function') this.engine.stop()
    if (this.raf) cancelAnimationFrame(this.raf)
  }

  setSize(w: number, h: number) {
    this.opts.width = w
    this.opts.height = h
    if (this.canvas instanceof HTMLCanvasElement) {
      this.canvas.width = w; this.canvas.height = h
    } else if (this.canvas instanceof OffscreenCanvas) {
      this.canvas.width = w; this.canvas.height = h
    }
    if (this.texture instanceof THREE.DataTexture) {
      this.texture.image.width = w; this.texture.image.height = h
      this.texture.needsUpdate = true
    }
  }

  updatePixelBufferFrom(buf: ArrayBuffer | Uint8Array) {
    if (!(this.texture instanceof THREE.DataTexture)) return
    const src = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
    const dst = this.texture.image.data as Uint8Array
    if (src.byteLength !== dst.byteLength) {
      console.warn('buffer size mismatch', src.byteLength, dst.byteLength)
      return
    }
    dst.set(src)
    this.texture.needsUpdate = true
  }

  setMesh(m: Mesh) {
    if (this.mesh && this.scene) this.scene.remove(this.mesh)
    this.mesh = m
    this.scene?.add(m)
  }

  applyToMaterial(material: Material) {
    if ('map' in material) {
      // @ts-ignore
      material.map = this.texture
      // @ts-ignore
      material.needsUpdate = true
    }
  }

  dispose() {
    this.stop()
    if (this.mesh && this.scene) {
      this.scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      if (Array.isArray(this.mesh.material)) this.mesh.material.forEach(m => m.dispose())
      else this.mesh.material.dispose()
    }
    if (this.texture) this.texture.dispose()
    if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
      try { (this.imageBitmap as any).close() } catch {}
    }
    if (this.canvas instanceof HTMLCanvasElement && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas)
    }
    if (this.engine) {
      if (typeof this.engine.stop === 'function') this.engine.stop()
      if (typeof this.engine.dispose === 'function') this.engine.dispose()
    }
  }
}

// 文件：src/integrations/pixel-buffer-helper.ts
import * as THREE from 'three'

export function createPixelBufferTexture(width: number, height: number, linear = true) {
  const size = width * height * 4
  const buf = new Uint8Array(size)
  const tex = new THREE.DataTexture(buf, width, height, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true

  function updateFrom(data: ArrayBuffer | Uint8Array) {
    const src = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    if (src.byteLength !== size) {
      console.warn('pixel buffer size mismatch', src.byteLength, size)
      return
    }
    tex.image.data.set(src)
    tex.needsUpdate = true
  }

  return { texture: tex, updateFrom }
}a

// 文件：src/integrations/index.ts
import { TaichiThreeBridge } from './taichi-three'
import { createPixelBufferTexture } from './pixel-buffer-helper'

export function createTaichiBridge(opts?: Partial<BridgeOptions>) {
  return new TaichiThreeBridge(opts || {})
}

export { TaichiThreeBridge, createPixelBufferTexture }
