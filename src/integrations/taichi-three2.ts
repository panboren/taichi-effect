// typescript
// 简介：创建一个可从 ArrayBuffer/Uint8Array 更新的 THREE.DataTexture 的帮助器

import * as THREE from 'three'

export function createPixelBufferTexture(
  width: number,
  height: number,
  linear = true
) {
  const size = width * height * 4
  const buffer = new Uint8Array(size) // 初始空白数据
  const tex = new THREE.DataTexture(buffer, width, height, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true

  // 接收来自 Taichi（worker 或 wasm）的像素数据并更新纹理
  // data 可以是 Uint8Array 或 ArrayBuffer（可 Transfer）
  function updateFromBuffer(data: ArrayBuffer | Uint8Array) {
    const src = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    if (src.byteLength !== size) {
      console.warn('pixel buffer size mismatch', src.byteLength, size)
      return
    }
    // 直接拷贝到 texture.image.data（避免创建新对象以减少 GC）
    tex.image.data.set(src)
    tex.needsUpdate = true
  }

  return {
    texture: tex,
    updateFromBuffer,
  }
}

// 使用示例简述（主线程）
// 1) 在主线程创建 texture helper： const { texture, updateFromBuffer } = createPixelBufferTexture(w,h)
// 2) 在 three 场景中把 texture 绑定到材质。
// 3) 当收到 worker/postMessage 的像素数据时，调用 updateFromBuffer(receivedBuffer)
//    （若是可转移的 ArrayBuffer，worker.postMessage({buf}, [buf]) 可以避免拷贝）
