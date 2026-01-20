// typescript
// 说明：示例演示在 three 中创建 GPU-side FBO/texture 并把句柄传给 Taichi。
// Taichi 端必须实现 `attachExternalFramebuffer(gl, fbo, texture, width, height)` 或类似 API。
// 生产环境需封装错误检测、状态恢复、同步（gl.finish/flush）与多平台兼容。

import * as THREE from 'three'

export async function createSharedFBOAndAttachToTaichi(
  renderer: THREE.WebGLRenderer,
  taichiEngine: any, // 替换为你的 Taichi 引擎类型
  width = 512,
  height = 512
) {
  // 1) 拿到底层 WebGL\*RenderingContext
  const gl = renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext

  // 2) 创建 GPU texture 和 framebuffer（WebGL2 优先）
  const texture = gl.createTexture()
  if (!texture) throw new Error('createTexture failed')
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.bindTexture(gl.TEXTURE_2D, null)

  const fbo = gl.createFramebuffer()
  if (!fbo) throw new Error('createFramebuffer failed')
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.warn('Framebuffer incomplete', status)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // 3) 在 three 中创建一个 RenderTarget，让 three 安全使用该 texture（保持 three 管理生命周期更安全）
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  })
  // 注意：WebGL texture 的真实句柄在 three 内部管理，下面只是把我们的外部纹理作为占位参考。
  // 若需要强行替换 three 管理的 GL texture，需要使用 renderer.properties（内部 API），不推荐。
  // 更稳妥做法：让 three 渲染使用 renderTarget，并在 Taichi 渲染后把 Taichi 的 texture 拷贝到 renderTarget（使用 gl.copyTexSubImage2D）
  // 这里将 renderTarget 用作材质 map：
  const material = new THREE.MeshBasicMaterial({ map: renderTarget.texture })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)

  // 4) 把 plane 加入场景（调用方负责 scene）
  // callerScene.add(plane) // 传入 scene 后加入

  // 5) 将原始 GL 句柄传给 Taichi（占位 API）
  // 示例：taichiEngine.attachExternalFramebuffer({ gl, fbo, texture, width, height })
  // Taichi 端需要能够接收这个 fbo/texture 并直接渲染到它
  if (typeof taichiEngine?.attachExternalFramebuffer === 'function') {
    (taichiEngine as any).attachExternalFramebuffer({ gl, fbo, texture, width, height })
  } else {
    console.warn('Taichi engine does not support attachExternalFramebuffer; implement binding on Taichi side')
  }

  // 6) 使用注意：
  // - 在每帧切换渲染目标时，三方必须保存/恢复 GL state（绑定的 framebuffer, program, viewport 等）。
  // - 渲染顺序示例：Taichi 渲染到 fbo -> restore gl state -> three 渲染场景（材质使用该纹理或进行 copy）
  // - 如果 three 不能直接使用 external texture，可在 Taichi 渲染后使用 gl.bindTexture + gl.copyTexSubImage2D 将 fbo 内容复制到 three 管理的 renderTarget.texture。

  return {
    gl,
    fbo,
    texture,
    renderTarget,
    plane,
  }
}
