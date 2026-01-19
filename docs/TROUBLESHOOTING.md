# Taichi Effect Engine - 故障排除指南

## 常见问题及解决方案

### 🔧 GPU 初始化错误

#### 问题：Failed to execute 'configure' on 'GPUCanvasContext'

**错误信息**:
```
TypeError: Failed to execute 'configure' on 'GPUCanvasContext':
Failed to read 'device' property from 'GPUCanvasConfiguration':
Failed to convert value to 'GPUDevice'.
```

**原因**:
- WebGL 上下文未正确初始化
- 画布未准备就绪
- 浏览器不支持 WebGL/WebGPU

**解决方案**:

1. **检查 WebGL 支持**
   - 打开浏览器控制台，运行：
   ```javascript
   const canvas = document.createElement('canvas')
   const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
   console.log('WebGL supported:', !!gl)
   ```

2. **启用硬件加速**
   - Chrome: 设置 → 系统 → 使用硬件加速模式
   - Firefox: 选项 → 常规 → 性能 → 勾选"使用推荐的性能设置"

3. **更新显卡驱动**
   - NVIDIA: https://www.nvidia.com/Download/index.aspx
   - AMD: https://www.amd.com/support
   - Intel: https://www.intel.com/content/www/us/en/download-center/home.html

4. **尝试不同浏览器**
   - 推荐 Chrome 90+ / Edge 90+ / Firefox 88+
   - Safari 支持 WebGL 2 但性能可能较差

---

### ⚠️ WebGL 不支持

#### 问题：浏览器不支持 WebGL

**错误信息**:
```
WebGL not supported
```

**解决方案**:

1. **检查浏览器版本**
   ```javascript
   console.log('User Agent:', navigator.userAgent)
   ```

2. **启用 WebGL 实验性功能** (Chrome/Edge)
   - 地址栏输入: `chrome://flags`
   - 搜索: "WebGL"
   - 启用所有 WebGL 选项
   - 重启浏览器

3. **使用兼容性检测工具**
   ```javascript
   import { detectWebGLSupport } from '@/utils/gpu'

   const webglInfo = detectWebGLSupport()
   console.log('WebGL Info:', webglInfo)
   ```

---

### 🚀 性能问题

#### 问题：帧率低

**症状**:
- FPS < 30
- 画面卡顿
- 参数更新延迟高

**解决方案**:

1. **降低渲染质量**
   ```typescript
   engine.setQuality(RenderQuality.LOW)
   ```

2. **减小画布尺寸**
   ```typescript
   engine.resize(window.innerWidth / 2, window.innerHeight / 2)
   ```

3. **关闭后处理效果**
   ```typescript
   engine.setPostProcessing([])
   ```

4. **禁用自动质量调整** (如果卡顿更严重)
   ```typescript
   const engine = new TaichiEffectEngine({
     autoQualityAdjustment: false,
   })
   ```

5. **检查 GPU 使用率**
   - Windows: 任务管理器 → 性能 → GPU
   - Mac: 活动监视器 → GPU 历史
   - Linux: `nvidia-smi` (NVIDIA) 或 `radeontop` (AMD)

---

### 💾 内存问题

#### 问题：内存占用过高

**症状**:
- 浏览器标签页崩溃
- GPU 内存不足警告
- 内存占用 > 500MB

**解决方案**:

1. **清理缓存**
   ```typescript
   engine.clearExpiredCache()
   ```

2. **禁用内存池** (调试用)
   ```typescript
   const engine = new TaichiEffectEngine({
     // 注意：这会降低性能
     enableMemoryPool: false,
   })
   ```

3. **减少特效复杂度**
   - 降低 `maxIterations` 参数
   - 减少 `particleCount`
   - 减少 `layers` 数量

4. **查看缓存统计**
   ```typescript
   const stats = engine.getCacheStats()
   console.log('Kernel Cache:', stats.kernelCache)
   console.log('Memory Pool:', stats.memoryPool)
   ```

---

### 📱 移动设备问题

#### 问题：移动设备性能差

**症状**:
- 严重卡顿
- 发热严重
- 电池消耗快

**解决方案**:

1. **使用低质量预设**
   ```typescript
   engine.setQuality(RenderQuality.LOW)
   ```

2. **降低分辨率**
   ```typescript
   // 移动设备使用 1/2 分辨率
   const dpr = window.devicePixelRatio || 1
   engine.resize(window.innerWidth / 2, window.innerHeight / 2)
   ```

3. **关闭粒子特效**
   - 粒子特效在移动设备上性能较差
   - 推荐使用 Plasma 或 Noise 特效

4. **启用低功耗模式**
   ```typescript
   const engine = new TaichiEffectEngine({
     targetFps: 30, // 降低目标 FPS
     defaultQuality: RenderQuality.LOW,
   })
   ```

---

### 🎨 特效问题

#### 问题：特效切换失败

**错误信息**:
```
Switch effect failed
特效不存在: xxx
```

**解决方案**:

1. **检查特效类型**
   ```typescript
   import { EffectType } from '@/engine'

   const availableEffects = engine.getAvailableEffects()
   console.log('Available:', availableEffects)
   ```

2. **使用正确的枚举值**
   ```typescript
   // ❌ 错误
   engine.switchEffect('fractal')

   // ✅ 正确
   engine.switchEffect(EffectType.FRACTAL)
   ```

3. **等待初始化完成**
   ```typescript
   await engine.init(canvas)
   await engine.switchEffect(EffectType.FRACTAL)
   ```

---

### 🔧 开发环境问题

#### 问题：HMR (热模块替换) 导致错误

**症状**:
- 刷新页面后引擎失效
- 控制台报错
- 特效不更新

**解决方案**:

1. **完全刷新页面**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

2. **清除缓存**
   ```typescript
   // 在控制台运行
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

3. **重启开发服务器**
   ```bash
   # 停止服务器 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

---

### 🐛 调试技巧

#### 启用调试模式

```typescript
engine.setDebugMode(true)
```

#### 查看性能指标

```typescript
const metrics = engine.getPerformanceMetrics()
console.log('FPS:', metrics.fps)
console.log('Avg FPS:', metrics.avgFps)
console.log('Frame Time:', metrics.frameTime, 'ms')
console.log('GPU Memory:', metrics.gpuMemory, 'MB')
```

#### 查看缓存状态

```typescript
const cacheStats = engine.getCacheStats()
console.log('Kernel Cache Size:', cacheStats.kernelCache)
console.log('Memory Pool:', cacheStats.memoryPool)
```

#### 检测 WebGL 支持

```typescript
import { detectWebGLSupport, checkTaichiCompatibility } from '@/utils/gpu'

const webglInfo = detectWebGLSupport()
console.log('WebGL Version:', webglInfo.version)
console.log('GPU Vendor:', webglInfo.vendor)
console.log('GPU Renderer:', webglInfo.renderer)

const compatibility = checkTaichiCompatibility()
console.log('Compatible:', compatibility.compatible)
console.log('Errors:', compatibility.errors)
console.log('Warnings:', compatibility.warnings)
```

---

### 📊 性能基准

参考以下性能基准来判断你的设备性能：

| 设备类型 | GPU | 预期 FPS | 推荐质量 |
|---------|-----|----------|----------|
| 高端台式机 | RTX 3080+ | 60+ | ULTRA |
| 中端台式机 | RTX 3060+ | 50-60 | HIGH |
| 低端台式机 | GTX 1650+ | 30-50 | MEDIUM |
| 高端笔记本 | RTX 4060 | 40-60 | HIGH |
| 中端笔记本 | GTX 1650 | 30-50 | MEDIUM |
| 低端笔记本 | 集成显卡 | 15-30 | LOW |
| 高端手机 | A15+/Snapdragon 8+ | 20-40 | LOW |
| 中端手机 | A13+/Snapdragon 7 | 15-30 | LOW |

---

### 🆘 获取帮助

如果以上解决方案都无法解决你的问题：

1. **收集诊断信息**
   ```javascript
   console.log('=== Diagnostic Info ===')
   console.log('Browser:', navigator.userAgent)
   console.log('WebGL:', detectWebGLSupport())
   console.log('Compatibility:', checkTaichiCompatibility())
   console.log('GPU Info:', getGPUInfo())
   ```

2. **创建最小复现示例**
   ```typescript
   import { useTaichiEngine } from '@/composables/useTaichiEngine'

   const { init } = useTaichiEngine({
     canvasRef: canvasRef,
     autoStart: false,
   })

   await init()
   ```

3. **报告问题**
   - 在 GitHub Issues 提交
   - 附上诊断信息
   - 提供复现步骤
   - 包含错误堆栈

---

### 📚 相关资源

- [WebGL 支持检查](https://webglreport.com/)
- [GPU 数据库](https://gpudb.com/)
- [Taichi.js 文档](https://taichi-lang.github.io/)
- [WebGL 性能优化](https://web.dev/performance/)
