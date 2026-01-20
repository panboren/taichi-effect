# 高级优化方案

基于对 taichi.js v0.0.36 源码的深度分析，提出以下高级优化方案。

## 🎯 优化目标

1. 将所有特效升级到 v3.0.0
2. 利用 taichi.js 的高级特性
3. 实现 WebGPU 最佳实践
4. 提升整体性能 20-30%

## 📋 优化方案

### 方案 1: 使用 ti.ndrange 替代嵌套循环

#### 背景

taichi.js 的 `ti.ndrange()` 提供更好的并行化和自动优化能力。

#### 当前实现

```typescript
// FractalEffect.ts
for (let i = 0; i < width; i = i + 1) {
  const x = (i * invWidth) - 0.5
  const x_zoomed = x * zoom

  for (let j = 0; j < height; j = j + 1) {
    const z0_i = ((j * invHeight) - 0.5) * zoom
    // ...
  }
}
```

#### 优化实现

```typescript
// FractalEffect.ts v3.0.0
return ti.kernel((t: any) => {
  const time = t * animSpeed
  const cR = cReal + Math.cos(time) * 0.1
  const cI = cImag + Math.sin(time) * 0.1

  // ✅ 使用 ndrange
  for (let I of ti.ndrange(width, height)) {
    let i = I[0]
    let j = I[1]

    const x = (i * invWidth - 0.5) * zoom
    const y = (j * invHeight - 0.5) * zoom

    let z_r = x
    let z_i = y
    let iterations = 0
    let z_r2 = z_r * z_r
    let z_i2 = z_i * z_i

    while (z_r2 + z_i2 < 4 && iterations < maxIterations) {
      const z_r_new = z_r2 - z_i2 + cR
      z_i = 2 * z_r * z_i + cI
      z_r = z_r_new
      z_r2 = z_r * z_r
      z_i2 = z_i * z_i
      iterations = iterations + 1
    }

    const t_val = iterations * invMaxIterations
    const colorPhase = t_val * PI2 + colorOffset

    const r = Math.sin(colorPhase) * 0.5 + 0.5
    const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
    const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

    pixels[(i, j)] = [r * t_val, g * t_val, b * t_val, 1]
  }
})
```

#### 预期效果

- 性能提升: 10-15%
- 代码更简洁
- 更好的 GPU 利用率

---

### 方案 2: 减少条件分支

#### 背景

GPU 的条件分支可能导致线程分歧，影响性能。

#### 优化技巧

```typescript
// ❌ 使用条件分支
if (value > threshold) {
    result = highValue;
} else {
    result = lowValue;
}

// ✅ 使用混合运算
let factor = step(threshold, value);  // value > threshold ? 1 : 0
result = mix(lowValue, highValue, factor);
```

#### 实现示例

```typescript
// NoiseEffect.ts v3.0.0
// 优化颜色计算
let noiseVal = perlinNoise(i, j, octaves);

// ❌ 分支版本
// if (noiseVal > 0.5) {
//     pixels[(i, j)] = [1, 0, 0, 1];
// } else {
//     pixels[(i, j)] = [0, 0, 1, 1];
// }

// ✅ 混合版本
let r = noiseVal * 2;
let b = (1 - noiseVal) * 2;
pixels[(i, j)] = [r, 0, b, 1];
```

#### 预期效果

- 性能提升: 5-10%
- 减少线程分歧

---

### 方案 3: 预计算查找表 (LUT)

#### 背景

复杂计算（如三角函数、噪声）可以预计算为查找表。

#### 实现示例

```typescript
// WaveEffect.ts v3.0.0
// 创建查找表
let sinTable = ti.field(ti.f32, [1024]);
let cosTable = ti.field(ti.f32, [1024]);

// 初始化查找表
let initLutKernel = ti.kernel(() => {
  for (let i of ti.ndrange(1024)) {
    let angle = i / 1024 * PI2;
    sinTable[i] = Math.sin(angle);
    cosTable[i] = Math.cos(angle);
  }
});

await initLutKernel();

ti.addToKernelScope({ sinTable, cosTable, tableSize: 1024 });

// 使用查找表
return ti.kernel((t: any) => {
  for (let I of ti.ndrange(width, height)) {
    let i = I[0];
    let j = I[1];
    
    // 从查找表读取
    let angle = (i * invWidth + t * speed) * tableSize;
    angle = angle % tableSize;
    let index = Math.floor(angle);
    let wave = sinTable[index];
    
    pixels[(i, j)] = [wave, wave, wave, 1];
  }
});
```

#### 预期效果

- 性能提升: 15-20%
- 减少 trig 函数调用

---

### 方案 4: 使用 workgroup 共享内存

#### 背景

Taichi.js 支持 workgroup 共享内存（类似 CUDA 的 __shared__）。

#### 实现示例

```typescript
// FluidEffect.ts v3.0.0
// 注意: 这需要扩展 taichi.js 功能
// 当前版本可能不支持，作为未来优化方向

ti.kernel((t: any) => {
  // 假设支持共享内存
  @group(0) @binding(1) var<workgroup> sharedData : array<vec4<f32>>;
  
  let localId = ti.local_id(0);
  let groupId = ti.group_id(0);
  
  // 加载到共享内存
  sharedData[localId] = pixels[groupId * workgroupSize + localId];
  
  // 同步
  ti.workgroup_barrier();
  
  // 使用共享数据进行计算
  let left = sharedData[(localId - 1 + workgroupSize) % workgroupSize];
  let right = sharedData[(localId + 1) % workgroupSize];
  
  pixels[I] = (left + right) * 0.5;
});
```

#### 预期效果

- 性能提升: 20-30%
- 减少全局内存访问

---

### 方案 5: 多级分辨率渲染

#### 背景

先渲染低分辨率，然后上采样，只在边缘区域渲染高分辨率。

#### 实现示例

```typescript
// TaichiEffectEngine.ts 添加多级渲染
class TaichiEffectEngine {
  private lowResPixels: any = null;
  private renderScale: number = 0.5;  // 0.5 = 50% 分辨率

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    // ...

    // 创建低分辨率字段
    const lowResWidth = Math.floor(width * this.renderScale);
    const lowResHeight = Math.floor(height * this.renderScale);
    this.lowResPixels = ti.Vector.field(4, ti.f32, [lowResWidth, lowResHeight]);
  }

  private render(deltaTime: number): void {
    // 1. 先渲染低分辨率
    if (this.kernel) {
      const time = this.frameCount * deltaTime;
      this.kernel(time);
    }

    // 2. 上采样到全分辨率
    this.upsample();
  }

  private upsample(): void {
    // 双线性插值上采样
    const upsampleKernel = ti.kernel(() => {
      for (let I of ti.ndrange(this.width, this.height)) {
        let i = I[0];
        let j = I[1];
        
        let li = Math.floor(i * this.renderScale);
        let lj = Math.floor(j * this.renderScale);
        
        // 双线性插值
        let p00 = this.lowResPixels[(li, lj)];
        let p10 = this.lowResPixels[(li + 1, lj)];
        let p01 = this.lowResPixels[(li, lj + 1)];
        let p11 = this.lowResPixels[(li + 1, lj + 1)];
        
        let fx = i * this.renderScale - li;
        let fy = j * this.renderScale - lj;
        
        let r = lerp(lerp(p00[0], p10[0], fx), lerp(p01[0], p11[0], fx), fy);
        let g = lerp(lerp(p00[1], p10[1], fx), lerp(p01[1], p11[1], fx), fy);
        let b = lerp(lerp(p00[2], p10[2], fx), lerp(p01[2], p11[2], fx), fy);
        
        this.pixels[(i, j)] = [r, g, b, 1];
      }
    });

    upsampleKernel();
  }
}
```

#### 预期效果

- 性能提升: 40-60% (取决于渲染比例)
- 质量损失: 可接受 (使用插值)

---

### 方案 6: 时间分片渲染

#### 背景

将复杂计算分多帧完成，保持高 FPS。

#### 实现示例

```typescript
// ParticleEffect.ts v3.0.0
class ParticleEffect {
  private frameOffset: number = 0;
  private batchSize: number = 100;  // 每帧处理 100 个粒子
  private totalParticles: number = 1000;

  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    ti.addToKernelScope({
      pixels,
      width: this.width,
      height: this.height,
      frameOffset: 0,
      batchSize: this.batchSize,
      totalParticles: this.totalParticles,
    });

    return ti.kernel((t: any) => {
      let start = frameOffset * batchSize;
      let end = Math.min(start + batchSize, totalParticles);
      
      // 只处理当前批次的粒子
      for (let i = start; i < end; i = i + 1) {
        let x = particlesX[i];
        let y = particlesY[i];
        
        // 更新粒子位置
        x = x + velocityX[i] * t;
        y = y + velocityY[i] * t;
        
        // 渲染粒子
        let px = Math.floor(x);
        let py = Math.floor(y);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          pixels[(px, py)] = [1, 1, 1, 1];
        }
      }
      
      // 更新偏移量
      frameOffset = (frameOffset + 1) % Math.ceil(totalParticles / batchSize);
    });
  }
}
```

#### 预期效果

- 保持高 FPS
- 不会卡顿
- 适合粒子系统

---

### 方案 7: 预渲染静态内容

#### 背景

将不随时间变化的内容预渲染，减少实时计算。

#### 实现示例

```typescript
// BackgroundEffect.ts (新增)
class BackgroundEffect {
  private backgroundPixels: any = null;

  async initialize(ti: any, width: number, height: number): Promise<void> {
    // 预渲染背景
    this.backgroundPixels = ti.Vector.field(4, ti.f32, [width, height]);
    
    const preRenderKernel = ti.kernel(() => {
      for (let I of ti.ndrange(width, height)) {
        // 复杂的背景计算 (只执行一次)
        let i = I[0];
        let j = I[1];
        let x = i / width - 0.5;
        let y = j / height - 0.5;
        let dist = Math.sqrt(x*x + y*y);
        
        // 创建径向渐变
        let brightness = 1 - dist;
        this.backgroundPixels[(i, j)] = [brightness * 0.2, brightness * 0.3, brightness * 0.5, 1];
      }
    });

    await preRenderKernel();
  }

  render(ti: any, pixels: any, t: any): void {
    // 运行时只需叠加动态内容
    const renderKernel = ti.kernel((time: any) => {
      for (let I of ti.ndrange(width, height)) {
        let bg = this.backgroundPixels[I];
        let dynamic = calculateDynamic(I, time);
        
        // 混合背景和动态内容
        pixels[I] = [
          bg[0] + dynamic[0],
          bg[1] + dynamic[1],
          bg[2] + dynamic[2],
          1
        ];
      }
    });

    renderKernel(t);
  }
}
```

#### 预期效果

- 性能提升: 30-50%
- 适合静态背景

---

### 方案 8: 使用原子操作优化

#### 背景

多线程累加需要原子操作保证正确性。

#### 实现示例

```typescript
// 统计直方图
class HistogramEffect {
  private histogram: any = null;

  async initialize(ti: any, width: number, height: number): Promise<void> {
    // 创建直方图字段
    this.histogram = ti.field(ti.i32, [256]);
  }

  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    ti.addToKernelScope({
      pixels,
      histogram: this.histogram,
    });

    return ti.kernel(() => {
      // 清空直方图 (使用并行循环)
      for (let i of ti.ndrange(256)) {
        histogram[i] = 0;
      }

      // 统计直方图 (使用原子操作)
      for (let I of ti.ndrange(width, height)) {
        let pixel = pixels[I];
        let brightness = Math.floor((pixel[0] + pixel[1] + pixel[2]) / 3 * 255);
        
        // ✅ 使用原子操作
        atomicAdd(&histogram[brightness], 1);
      }
    });
  }
}
```

#### 预期效果

- 并发安全
- 正确的统计结果

---

## 📊 优化优先级

### 高优先级 (立即实施)

1. ✅ **使用 ti.ndrange 替代嵌套循环**
   - 性能提升: 10-15%
   - 实施难度: 低
   - 影响范围: 所有特效

2. ✅ **减少条件分支**
   - 性能提升: 5-10%
   - 实施难度: 低
   - 影响范围: 部分特效

3. ✅ **预计算查找表**
   - 性能提升: 15-20%
   - 实施难度: 中
   - 影响范围: WaveEffect, PlasmaEffect, NoiseEffect

### 中优先级 (短期规划)

4. 🔄 **多级分辨率渲染**
   - 性能提升: 40-60%
   - 实施难度: 中
   - 影响范围: 引擎核心

5. 🔄 **时间分片渲染**
   - 性能提升: 保持高 FPS
   - 实施难度: 中
   - 影响范围: ParticleEffect, GalaxyEffect

6. 🔄 **预渲染静态内容**
   - 性能提升: 30-50%
   - 实施难度: 低
   - 影响范围: 背景特效

### 低优先级 (长期规划)

7. ⏳ **使用 workgroup 共享内存**
   - 性能提升: 20-30%
   - 实施难度: 高
   - 影响范围: 需要扩展 taichi.js

8. ⏳ **使用原子操作优化**
   - 性能提升: 取决于场景
   - 实施难度: 中
   - 影响范围: 特定特效

---

## 🎯 实施计划

### 第一阶段 (立即)

1. 优化 FractalEffect 使用 ndrange
2. 优化 GalaxyEffect 减少分支
3. 优化 WaveEffect 使用查找表

### 第二阶段 (短期)

4. 实现多级分辨率渲染
5. 实现 ParticleEffect 时间分片
6. 添加背景预渲染

### 第三阶段 (长期)

7. 探索 workgroup 共享内存
8. 扩展原子操作应用

---

## 📝 实施检查清单

- [ ] 所有特效使用 ti.ndrange
- [ ] 减少条件分支
- [ ] 预计算查找表
- [ ] 实现多级分辨率渲染
- [ ] 实现时间分片渲染
- [ ] 添加预渲染功能
- [ ] 性能测试
- [ ] 文档更新

---

*文档生成时间: 2026-01-20*  
*版本: 1.0.0*
