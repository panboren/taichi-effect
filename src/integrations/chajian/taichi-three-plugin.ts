// typescript
// 文件：src/integrations/taichi-three-plugin.ts
import * as THREE from 'three'
import type { WebGLRenderer, Scene, Camera, Texture, Mesh, Material } from 'three'

export interface TaichiThreeOptions {
  width?: number
  height?: number
  useOffscreen?: boolean
  appendToBody?: boolean
  planeSize?: { width: number; height: number }
  textureLinear?: boolean
  autoStart?: boolean
  mode?: 'canvas' | 'imageBitmap' | 'pixelBuffer'
  pixelBuffer?: { width: number; height: number; texture?: THREE.DataTexture }
  onError?: (err: any) => void
  onBeforeStep?: (time: number) => void
  onAfterStep?: (time: number) => void
}

type TaichiEngineAny = any

export class TaichiThreeBridge {
  public taichiEngine?: TaichiEngineAny
  public taichiCanvas!: HTMLCanvasElement | OffscreenCanvas
  public texture!: Texture
  public mesh?: Mesh
  public imageBitmap?: ImageBitmap
  public options: Required<TaichiThreeOptions>

  private renderer?: WebGLRenderer
  private scene?: Scene
  private camera?: Camera
  private running = false
  private rafId = 0

  constructor(opts: TaichiThreeOptions = {}) {
    this.options = {
      width: opts.width ?? 512,
      height: opts.height ?? 512,
      useOffscreen: opts.useOffscreen ?? false,
      appendToBody: opts.appendToBody ?? false,
      planeSize: opts.planeSize ?? { width: 2, height: 2 },
      textureLinear: opts.textureLinear ?? true,
      autoStart: opts.autoStart ?? true,
      mode: opts.mode ?? (opts.useOffscreen && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function' ? 'imageBitmap' : 'canvas'),
      pixelBuffer: opts.pixelBuffer ?? { width: opts.width ?? 512, height: opts.height ?? 512 },
      onError: opts.onError ?? (() => {}),
      onBeforeStep: opts.onBeforeStep ?? (() => {}),
      onAfterStep: opts.onAfterStep ?? (() => {}),
    } as Required<TaichiThreeOptions>
  }

  async init(
    taichiEngine: TaichiEngineAny,
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera
  ) {
    this.taichiEngine = taichiEngine
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    const w = this.options.width
    const h = this.options.height

    // create canvas / offscreen depending on mode
    if (this.options.mode === 'imageBitmap' && typeof OffscreenCanvas !== 'undefined') {
      this.taichiCanvas = new OffscreenCanvas(w, h)
    } else {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.style.display = 'none'
      if (this.options.appendToBody) document.body.appendChild(c)
      this.taichiCanvas = c
    }

    // attach canvas to taichi engine if possible
    try {
      if (this.taichiEngine) {
        if (typeof this.taichiEngine.attachCanvas === 'function') {
          this.taichiEngine.attachCanvas(this.taichiCanvas)
        } else if (typeof this.taichiEngine.setCanvas === 'function') {
          this.taichiEngine.setCanvas(this.taichiCanvas)
        }
      }
    } catch (e) {
      this.options.onError(e)
    }

    // create texture according to mode
    if (this.options.mode === 'pixelBuffer') {
      // if user provided DataTexture use it, else create one lazily via helper (user can call setPixelBufferTexture)
      if (this.options.pixelBuffer.texture) {
        this.texture = this.options.pixelBuffer.texture
      } else {
        const size = this.options.pixelBuffer.width * this.options.pixelBuffer.height * 4
        const buf = new Uint8Array(size)
        const dt = new THREE.DataTexture(buf, this.options.pixelBuffer.width, this.options.pixelBuffer.height, THREE.RGBAFormat, THREE.UnsignedByteType)
        dt.minFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
        dt.magFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
        dt.generateMipmaps = false
        dt.needsUpdate = true
        this.texture = dt
      }
    } else if (this.options.mode === 'imageBitmap' && typeof createImageBitmap === 'function' && this.taichiCanvas instanceof OffscreenCanvas) {
      // placeholder texture, will set image = ImageBitmap at runtime
      const t = new THREE.Texture()
      t.minFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      t.magFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      t.generateMipmaps = false
      t.needsUpdate = true
      this.texture = t
    } else {
      const canvasTex = new THREE.CanvasTexture(this.taichiCanvas as HTMLCanvasElement)
      canvasTex.minFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      canvasTex.magFilter = this.options.textureLinear ? THREE.LinearFilter : THREE.NearestFilter
      canvasTex.generateMipmaps = false
      canvasTex.needsUpdate = true
      this.texture = canvasTex
    }

    // create default mesh (user can replace)
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true })
    const geo = new THREE.PlaneGeometry(this.options.planeSize.width, this.options.planeSize.height)
    this.mesh = new THREE.Mesh(geo, mat)
    this.scene!.add(this.mesh)

    if (this.options.autoStart) this.start()
  }

  async step(time = performance.now()) {
    if (!this.taichiEngine) return
    try {
      this.options.onBeforeStep(time)
      // drive taichi
      if (typeof this.taichiEngine.update === 'function') {
        this.taichiEngine.update(time)
      } else if (typeof this.taichiEngine.render === 'function') {
        this.taichiEngine.render(time)
      }

      // sync texture
      if (this.options.mode === 'imageBitmap' && this.taichiCanvas instanceof OffscreenCanvas && typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(this.taichiCanvas)
          if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
            try { (this.imageBitmap as any).close() } catch {}
          }
          this.imageBitmap = bitmap
          ;(this.texture as THREE.Texture).image = bitmap
          this.texture.needsUpdate = true
        } catch (e) {
          this.options.onError(e)
        }
      } else if (this.options.mode === 'canvas') {
        if (this.texture instanceof THREE.CanvasTexture) {
          this.texture.needsUpdate = true
        } else {
          this.texture.image = this.taichiCanvas as HTMLCanvasElement
          this.texture.needsUpdate = true
        }
      } else if (this.options.mode === 'pixelBuffer') {
        // pixelBuffer mode expects external caller to call updatePixelBuffer / updateFromBuffer
        // nothing to do here by default
      }

      this.options.onAfterStep(time)
    } catch (e) {
      this.options.onError(e)
    }
  }

  start() {
    if (this.running) return
    this.running = true
    if (this.taichiEngine && typeof this.taichiEngine.start === 'function') {
      this.taichiEngine.start()
    }
    const loop = (t: number) => {
      if (!this.running) return
      this.step(t).then(() => {
        this.rafId = requestAnimationFrame(loop)
      })
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    if (this.taichiEngine && typeof this.taichiEngine.stop === 'function') {
      this.taichiEngine.stop()
    }
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  setSize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    if (this.taichiCanvas instanceof HTMLCanvasElement) {
      this.taichiCanvas.width = width
      this.taichiCanvas.height = height
    } else if (this.taichiCanvas instanceof OffscreenCanvas) {
      this.taichiCanvas.width = width
      this.taichiCanvas.height = height
    }
    if (this.texture instanceof THREE.DataTexture) {
      this.texture.image.width = width
      this.texture.image.height = height
      this.texture.needsUpdate = true
    }
  }

  // 适用于 pixelBuffer 模式：从 worker 收到数据后调用
  updatePixelBufferFrom(data: ArrayBuffer | Uint8Array) {
    if (!(this.texture instanceof THREE.DataTexture)) {
      console.warn('texture is not DataTexture, updatePixelBufferFrom ignored')
      return
    }
    const src = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    if (src.byteLength !== (this.texture.image.data as Uint8Array).byteLength) {
      console.warn('pixel buffer size mismatch', src.byteLength, (this.texture.image.data as Uint8Array).byteLength)
      return
    }
    ;(this.texture.image.data as Uint8Array).set(src)
    this.texture.needsUpdate = true
  }

  setMesh(mesh: Mesh) {
    if (this.mesh && this.scene) this.scene.remove(this.mesh)
    this.mesh = mesh
    if (this.scene) this.scene.add(mesh)
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
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose())
      } else {
        this.mesh.material.dispose()
      }
    }
    if (this.texture) this.texture.dispose()
    if (this.imageBitmap && typeof (this.imageBitmap as any).close === 'function') {
      try { (this.imageBitmap as any).close() } catch {}
    }
    if (this.taichiCanvas instanceof HTMLCanvasElement && this.taichiCanvas.parentElement) {
      this.taichiCanvas.parentElement.removeChild(this.taichiCanvas)
    }
    if (this.taichiEngine) {
      if (typeof this.taichiEngine.stop === 'function') this.taichiEngine.stop()
      if (typeof this.taichiEngine.dispose === 'function') this.taichiEngine.dispose()
    }
  }
}
