// typescript
// 文件：src/integrations/pixel-buffer-helper.ts
import * as THREE from 'three'

export function createPixelBufferTexture(
  width: number,
  height: number,
  linear = true
) {
  const size = width * height * 4
  const buffer = new Uint8Array(size)
  const tex = new THREE.DataTexture(buffer, width, height, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true

  function updateFromBuffer(data: ArrayBuffer | Uint8Array) {
    const src = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    if (src.byteLength !== size) {
      console.warn('pixel buffer size mismatch', src.byteLength, size)
      return
    }
    tex.image.data.set(src)
    tex.needsUpdate = true
  }

  return {
    texture: tex,
    updateFromBuffer,
  }
}
