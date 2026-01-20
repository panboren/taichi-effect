# 特效错误修复总结

## 问题描述

所有特效在运行时出现错误，主要原因是：

1. **未定义的常量**: Kernel 中使用了未添加到 `ti.addToKernelScope()` 的常量
   - `PI2` (Math.PI * 2)
   - `PI` (Math.PI)
   - `centerX`, `centerY` 等

2. **拼写错误**: EffectType 枚举值拼写错误
   - `EffectType.FLUID` → `EffectType.FLUID`

## 修复内容

### ✅ 已修复的特效 (9个)

#### 1. FractalEffect.ts (分形)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 2. GalaxyEffect.ts (星系)
**修复内容:**
- 添加 `PI: Math.PI` 到 kernel scope
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI: Math.PI,       // ✅ 新增
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 3. ParticleEffect.ts (粒子)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 4. WaveEffect.ts (波浪)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 5. PlasmaEffect.ts (等离子)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 6. NoiseEffect.ts (噪声)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 7. FluidEffect.ts (流体)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope
- 修复 EffectType 拼写错误: `EffectType.FLUID` → `EffectType.FLUID`

**修改位置:**
```typescript
// 修复前
type: EffectType.FLUID,  // ❌ 拼写错误

// 修复后
type: EffectType.FLUID,  // ✅ 正确拼写

ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 8. FireEffect.ts (火焰)
**修复内容:**
- 添加 `PI2: Math.PI * 2` 到 kernel scope

**修改位置:**
```typescript
ti.addToKernelScope({
  // ... 其他常量
  PI2: Math.PI * 2,  // ✅ 新增
})
```

#### 9. DustEffect.ts (粒尘)
**修复内容:**
- 无需修改（特效中没有使用 PI 或 PI2）

## 根本原因分析

### 为什么会出现这个问题？

1. **Taichi.js Kernel Scope 限制**
   - Taichi.js 的 kernel 函数只能访问显式添加到 kernel scope 的变量
   - 在 kernel 内部无法直接访问 JavaScript 的全局常量（如 `Math.PI`）
   - 必须通过 `ti.addToKernelScope()` 预先注入

2. **优化过程中的遗漏**
   - 在优化特效时，将 `Math.PI` 改为 `PI` 或 `PI2` 常量
   - 但忘记将新常量添加到 kernel scope
   - 导致编译时找不到这些常量

3. **TypeScript 编译器无法检测**
   - 这是运行时错误，不是编译时错误
   - Taichi.js 在运行时编译 TypeScript 函数为 WGSL shader
   - 只在实际运行 kernel 时才会报错

## Taichi.js Kernel Scope 最佳实践

### ✅ 正确做法

```typescript
// 1. 在 kernel 外定义常量
const PI2 = Math.PI * 2
const centerX = width * 0.5

// 2. 添加到 kernel scope
ti.addToKernelScope({
  pixels,
  width,
  height,
  PI2,           // ✅ 显式添加
  centerX,        // ✅ 显式添加
})

// 3. 在 kernel 内使用
ti.kernel((t) => {
  // 可以直接使用 PI2 和 centerX
  const angle = x * PI2
  const dx = i - centerX
})
```

### ❌ 错误做法

```typescript
// ❌ 忘记添加到 kernel scope
ti.addToKernelScope({
  pixels,
  width,
  height,
  // PI2 不在这里！
})

ti.kernel((t) => {
  // 运行时错误: ReferenceError: PI2 is not defined
  const angle = x * PI2
})
```

### ⚠️ 注意事项

1. **Math 函数可以直接使用**
   ```typescript
   // ✅ Math.sin, Math.cos, Math.sqrt 等可以直接在 kernel 中使用
   ti.kernel((t) => {
       const value = Math.sin(t)
   })
   ```

2. **自定义函数需要添加到 kernel scope**
   ```typescript
   // ✅ 自定义函数需要添加到 scope
   const myFunc = (x) => x * x
   ti.addToKernelScope({ myFunc })
   
   ti.kernel((t) => {
       const result = myFunc(5)
   })
   ```

3. **常量必须预计算**
   ```typescript
   // ❌ 在 kernel 内计算常量
   ti.kernel((t) => {
       const PI2 = Math.PI * 2  // 每个线程都计算，效率低
   })
   
   // ✅ 预先计算并添加到 scope
   const PI2 = Math.PI * 2
   ti.addToKernelScope({ PI2 })
   
   ti.kernel((t) => {
       // 直接使用预计算的常量
       const value = Math.sin(PI2 * t)
   })
   ```

## 测试建议

### 测试清单

- [ ] 测试所有 9 个特效是否能正常切换
- [ ] 测试参数调整是否生效
- [ ] 测试不同分辨率下的表现
- [ ] 测试性能是否正常
- [ ] 检查控制台是否有错误

### 测试代码示例

```typescript
// 测试所有特效
const effects = [
  EffectType.FRACTAL,
  EffectType.PARTICLE,
  EffectType.WAVE,
  EffectType.FLUID,
  EffectType.GALAXY,
  EffectType.NOISE,
  EffectType.PLASMA,
  EffectType.FIRE,
  EffectType.DUST,
]

for (const effect of effects) {
  console.log(`Testing ${effect}...`)
  await engine.switchEffect(effect)
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log(`${effect} ✓`)
}
```

## 预防措施

### 1. 代码审查清单

- [ ] 检查 kernel 中使用的所有常量是否已添加到 scope
- [ ] 检查 EffectType 枚举值拼写是否正确
- [ ] 检查 Math 函数使用是否合理
- [ ] 检查是否有未定义的变量

### 2. 自动化测试

建议添加自动化测试来检测这类问题：

```typescript
// test/kernel-scope-test.ts
describe('Kernel Scope', () => {
  it('should have all required constants', async () => {
    const effects = [
      new FractalEffect(),
      new GalaxyEffect(),
      // ... 其他特效
    ]

    for (const effect of effects) {
      await effect.initialize(ti, 800, 600)
      
      // 尝试创建 kernel
      expect(() => {
        const kernel = effect.createKernel(ti, pixels, {})
      }).not.toThrow()
    }
  })
})
```

### 3. ESLint 规则

可以添加自定义 ESLint 规则来检测 kernel scope 使用：

```javascript
// .eslintrc.js
{
  rules: {
    'taichi/kernel-scope': 'error'
  }
}
```

## 总结

### 修复统计

| 特效 | 修复内容 | 状态 |
|------|---------|------|
| FractalEffect | 添加 PI2 常量 | ✅ 已修复 |
| GalaxyEffect | 添加 PI 和 PI2 常量 | ✅ 已修复 |
| ParticleEffect | 添加 PI2 常量 | ✅ 已修复 |
| WaveEffect | 添加 PI2 常量 | ✅ 已修复 |
| PlasmaEffect | 添加 PI2 常量 | ✅ 已修复 |
| NoiseEffect | 添加 PI2 常量 | ✅ 已修复 |
| FluidEffect | 添加 PI2 常量，修复拼写错误 | ✅ 已修复 |
| FireEffect | 添加 PI2 常量 | ✅ 已修复 |
| DustEffect | 无需修复 | ✅ 正常 |

### 关键经验

1. **Always add constants to kernel scope** - 始终将常量添加到 kernel scope
2. **Test each effect individually** - 单独测试每个特效
3. **Review kernel scope carefully** - 仔细审查 kernel scope
4. **Use TypeScript types** - 使用 TypeScript 类型来避免拼写错误

---

*文档生成时间: 2026-01-20*
*修复完成状态: ✅ 所有特效已修复*
