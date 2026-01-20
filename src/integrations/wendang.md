``````


// typescript
// 使用示例：基本初始化、普通 Canvas 模式与 Offscreen 模式

import * as THREE from 'three'
import { TaichiThreeBridge } from './src/integrations/taichi-three'
import { TaichiEffectEngine } from './src/engine' // 根据实际路径与构造调整

// 1) 普通 Canvas 模式（简单）
// - 适合快速集成；bridge 会创建隐藏的 HTMLCanvas 并 attach 给 taichiEngine（若引擎支持 attach/setCanvas）
async function exampleCanvasMode() {
// three.js 基本设置
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 5)

// 创建 Taichi 引擎实例（示例，实际构造请按你的 SDK）
const taichiEngine = new TaichiEffectEngine({ /* 可选参数 */ })

// 创建并初始化桥接器（不使用 Offscreen）
const bridge = new TaichiThreeBridge({
width: 512,
height: 512,
useOffscreen: false,
appendToBody: false,
autoStart: false,
})

await bridge.init(taichiEngine, renderer, scene, camera)

// 启动桥接（会调用 taichiEngine.start() 如果存在）
bridge.start()

// 主渲染循环（bridge 默认会通过 requestAnimationFrame 自行 step）
function renderLoop() {
renderer.render(scene, camera)
requestAnimationFrame(renderLoop)
}
renderLoop()

// 调用 bridge.dispose() 清理
// bridge.dispose()
}

// 2) OffscreenCanvas 模式（高性能，常与 Worker 联合使用）
// - 若需要把 Taichi 放到 Worker 中渲染，需把 bridge 创建的 OffscreenCanvas 传入 worker。
// - 示例展示如何初始化 bridge 并在主循环中使用 step（不自动 start）。
async function exampleOffscreenMode() {
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 5)

// 如果要在 Worker 中运行 Taichi，需要在 Worker 中创建/接收 OffscreenCanvas。
// 这里先创建 bridge 以生成 OffscreenCanvas 并传给 worker。
const bridge = new TaichiThreeBridge({
width: 1024,
height: 1024,
useOffscreen: true,
autoStart: false,
})

// 创建一个占位的 TaichiEffectEngine（或在 worker 中创建并通过 postMessage 绑定）
const taichiEngine = new TaichiEffectEngine({ /* or create in worker */ })

await bridge.init(taichiEngine, renderer, scene, camera)

// 如果你在 worker 中创建 Taichi，请把 bridge.taichiCanvas (OffscreenCanvas) 通过 postMessage 传给 worker：
// worker.postMessage({ type: 'init', canvas: bridge.taichiCanvas }, [bridge.taichiCanvas])

// 手动 step（例如你希望在主循环中控制纹理同步）
async function frame(t: number) {
// 1) 若 taichi 在 worker，请让 worker 渲染一帧并返回（或 worker 自行循环）
// 2) 在主线程调用 bridge.step() 以更新 texture（Offscreen -> ImageBitmap）
await bridge.step(t)
renderer.render(scene, camera)
requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
}

// API 快速参考（方法与作用）
// - constructor(opts): 选项见接口 TaichiThreeOptions（width/height/useOffscreen/appendToBody/planeSize/textureLinear/autoStart）
// - init(taichiEngine, renderer, scene, camera): 绑定引擎与 three 上下文，创建 canvas/texture/mesh
// - start(): 开始内部 RAF 循环并调用 taichiEngine.start()（如存在）
// - stop(): 停止内部循环并调用 taichiEngine.stop()（如存在）
// - step(time): 手动推进一帧：驱动 taichi 渲染并把结果同步到 Three 的纹理（Offscreen 使用 createImageBitmap）
// - dispose(): 完整清理（移除 mesh、释放 texture、关闭 imageBitmap、移除 DOM canvas、销毁 taichi 引擎）

// 清理注意事项
// - Offscreen + ImageBitmap 模式下，bridge 会在更新时替换并关闭旧的 ImageBitmap，调用 dispose() 也会尝试关闭。
// - 若 taichi 在 Worker 中运行，销毁时需在 worker 端停止并释放资源。
// - 若你希望自己统一渲染流程，可在构造时禁用 autoStart 并在外层 RAF 中调用 bridge.step()。

// 以上示例为最小集成模版，按项目里 TaichiEffectEngine 的真实 API（构造参数、attachCanvas/setCanvas、start/stop/dispose 等）做适配。









``````
