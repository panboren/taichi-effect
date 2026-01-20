# Taichi.js 特效优化指南

## Taichi.js 核心优化原则

### 1. Kernel 编译优化
- **避免条件分支**: 在 kernel 中尽量减少 if-else，使用数学表达式替代
- **循环展开**: 对于小规模循环，手动展开可提升性能
- **减少内存访问**: 重复使用的值存储在局部变量中
- **使用预计算**: 常量在 kernel 外计算，通过 addToKernelScope 传入

### 2. 数据类型优化
```typescript
// 推荐使用 f32 而非 f64（精度足够且更快）
ti.Vector.field(4, ti.f32, [width, height])

// 避免在 kernel 中动态创建对象
// ❌ 不好
const color = [r, g, b, 1]
pixels[(i, j)] = color

// ✅ 好
pixels[(i, j)] = [r, g, b, 1]
```

### 3. 数学运算优化
```typescript
// 使用常量避免重复计算
ti.addToKernelScope({
  PI2: Math.PI * 2,
  SQRT2: Math.SQRT2,
})

// 使用乘法代替除法
// ❌ const x = i / width
// ✅ const x = i * invWidth（提前计算 invWidth = 1.0 / width）

// 使用乘方代替 Math.pow（简单幂次）
// ❌ x * x * x
// ✅ x * x * x（编译器会自动优化）
```

### 4. 内存访问模式
```typescript
// 顺序访问比随机访问快
// pixels[(i, j)] 的访问顺序很重要

// 内层循环变化维度应该连续
for (let j = 0; j < height; j = j + 1) {  // 外层
  for (let i = 0; i < width; i = i + 1) {  // 内层，连续访问
    pixels[(i, j)] = ...
  }
}
```

### 5. Taichi.js 特殊语法
```typescript
// 禁用的 JavaScript 特性
❌ for...of 循环
❌ for...in 循环
❌ switch-case 语句
❌ 解构赋值
❌ 扩展运算符
❌ async/await
❌ 类方法（在 kernel 内部）

// 推荐的写法
for (let i = 0; i < width; i = i + 1) { ... }
if (condition) { ... } else if (...) { ... }
```

## 特效优化清单

### 通用优化
1. ✅ 使用 `i = i + 1` 而非 `i++`
2. ✅ 使用嵌套 for 循环而非 for-of
3. ✅ 使用 if-else 链而非 switch
4. ✅ 预计算常量（如 invWidth = 1.0 / width）
5. ✅ 使用 PI2 常量代替 6.28

### 性能优化
1. 减少不必要的 Math 调用
2. 使用局部变量缓存重复计算的值
3. 避免在循环内创建对象
4. 优化循环顺序（内层循环连续访问）
5. 使用数学恒等式简化计算

## 各特效具体优化建议

### FractalEffect (分形)
- 预计算 maxIterations 的倒数
- 优化 Julia Set 迭代公式
- 使用提前退出减少迭代次数

### ParticleEffect (粒子)
- 使用数组结构而非对象
- 减少三角函数调用
- 使用空间分区优化碰撞检测

### WaveEffect (波浪)
- 预计算频率倍数
- 使用查找表替代 sin/cos（可能）
- 优化叠加计算

### FluidEffect (流体)
- 减少噪声计算次数
- 使用低分辨率噪声插值
- 优化湍流计算

### GalaxyEffect (星系)
- 预计算螺旋臂数据
- 优化距离计算（避免 sqrt）
- 使用近似算法

### NoiseEffect (噪声)
- 减少层数或使用渐进式计算
- 缓存层间结果
- 使用快速噪声算法

### PlasmaEffect (等离子)
- 优化波形叠加
- 减少颜色计算
- 使用混合模式优化

### FireEffect (火焰)
- 减少噪声采样
- 使用近似火焰公式
- 优化粒子更新

### DustEffect (粒尘)
- 使用预生成噪声图
- 减少随机数生成
- 优化粒子运动
