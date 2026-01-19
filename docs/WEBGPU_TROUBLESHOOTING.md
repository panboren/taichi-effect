# WebGPU 故障排除指南

本文档帮助您解决 taichi.js WebGPU 初始化问题。

---

## 问题诊断

### 症状：`FATAL ERROR: canvas webgpu context is null`

**这意味着**：
- ✅ 浏览器支持 WebGPU API（`navigator.gpu` 存在）
- ❌ 但无法创建 WebGPU Canvas 上下文

**可能原因**：
1. 底层显卡驱动不支持 WebGPU
2. 浏览器 WebGPU 支持不完整
3. 系统环境限制（虚拟机、远程桌面等）
4. 显卡驱动过旧

---

## 解决方案

### 方案 1：更新显卡驱动（最推荐）

**NVIDIA 显卡**：
1. 访问 [NVIDIA 驱动下载](https://www.nvidia.com/Download/index.aspx)
2. 下载最新的驱动程序
3. 安装并重启电脑

**AMD 显卡**：
1. 访问 [AMD 驱动下载](https://www.amd.com/en/support)
2. 下载最新的驱动程序
3. 安装并重启电脑

**Intel 集成显卡**：
1. 访问 [Intel 驱动下载](https://www.intel.com/content/www/us/en/download-center/home.html)
2. 下载最新的驱动程序
3. 安装并重启电脑

---

### 方案 2：启用 WebGPU Flags

**Chrome / Edge**：
1. 在地址栏输入：`chrome://flags`
2. 搜索关键词：`WebGPU`
3. 启用以下选项（如果有）：
   - `Unsafe WebGPU`
   - `WebGPU Developer Features`
   - `WebGPU Compat`
4. 点击页面底部的 `Relaunch` 按钮重启浏览器

**注意事项**：
- 这些是实验性功能，可能不稳定
- 生产环境不建议使用

---

### 方案 3：重置硬件加速

**Chrome / Edge**：
1. 打开浏览器设置
2. 进入 `设置` -> `系统` -> `性能`
3. **禁用** `使用硬件加速（如果可用）`
4. 重启浏览器
5. 再次进入设置，**启用**硬件加速
6. 再次重启浏览器

**原因**：
- 强制浏览器重新检测 GPU 能力
- 清除缓存的 GPU 信息

---

### 方案 4：更换浏览器

**推荐浏览器**（按优先级）：
1. **Chrome 113+** (WebGPU 支持最好)
2. **Edge 113+** (与 Chrome 相同内核)
3. **Safari 17.2+** (macOS)

**不推荐**：
- Firefox (WebGPU 支持有限)
- 旧版本浏览器 (< Chrome 113)

---

### 方案 5：检查系统环境

**虚拟机环境**：
- WebGPU 在虚拟机中可能不可用
- 如果在 VMware、VirtualBox 等虚拟机中运行：
  - 启用 3D 加速
  - 或直接在宿主机上运行

**远程桌面**：
- 远程桌面连接可能禁用 GPU 加速
- 尝试直接在本地运行

**Windows 更新**：
1. 进入 `设置` -> `更新和安全`
2. 检查并安装所有更新
3. 重启电脑

---

## 详细诊断

### 查看控制台输出

本应用会输出详细的 WebGPU 诊断信息：

```javascript
// 浏览器控制台输出示例
WebGPU Info: {
  supported: false,
  hasGPU: true,
  error: '无法获取 GPU 适配器',
  suggestions: [
    '您的浏览器支持 WebGPU API，但底层驱动或硬件不支持',
    '请更新显卡驱动到最新版本',
    ...
  ]
}
```

### 使用在线测试工具

访问以下网站测试 WebGPU 支持：

1. [WebGPU Report](https://webgpureport.com/)
   - 查看详细的 WebGPU 支持报告

2. [WebGPU Samples](https://webglsamples.org/WebGPU/)
   - 运行示例测试 WebGPU 功能

---

## 已知问题

### Intel 集成显卡

**问题**：
- Intel UHD Graphics 630 等较旧型号
- 可能不支持 WebGPU

**解决方案**：
1. 更新到最新的 Intel 显卡驱动
2. 启用 WebGPU flags (方案 2)
3. 如仍不行，更换为独立显卡

### Windows 7 / 8

**问题**：
- WebGPU 仅支持 Windows 10 及以上

**解决方案**：
- 升级到 Windows 10 或 Windows 11

---

## 系统要求

### 最低要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10+, macOS 10.15+, Linux |
| 浏览器 | Chrome 113+, Edge 113+, Safari 17.2+ |
| 显卡 | 支持 Vulkan 1.1+ 或 DX12 |

### 推荐配置

| 项目 | 推荐 |
|------|------|
| 操作系统 | Windows 10 21H2+, macOS 12+ |
| 浏览器 | Chrome 120+, Edge 120+ |
| 显卡 | NVIDIA GTX 1060+ / AMD RX 580+ / Intel Arc |

---

## 常见问题 (FAQ)

### Q1: 为什么 `navigator.gpu` 存在但还是报错？

**A**: 这表示浏览器支持 WebGPU API，但底层 GPU 驱动不支持。需要：
1. 更新显卡驱动
2. 启用实验性 WebGPU flags
3. 更换浏览器版本

---

### Q2: taichi.js 为什么不支持 WebGL？

**A**: taichi.js v0.0.36 是 WebGPU 框架，不支持 WebGL 后退。如需 WebGL 支持，可以：
1. 等待 taichi.js 未来版本支持 WebGL
2. 使用其他 WebGL 框架（如 Three.js、Pixi.js）

---

### Q3: 在虚拟机中能运行吗？

**A**: 通常不支持。WebGPU 需要：
- 直接访问 GPU 硬件
- 虚拟机的虚拟 GPU 通常不支持完整的 WebGPU

建议在宿主机上运行。

---

### Q4: Firefox 支持吗？

**A**: 有限支持。Firefox 的 WebGPU 实现还在开发中：
- 在 `about:config` 中设置 `dom.webgpu.enabled = true`
- 但功能不完整，可能不稳定
- 推荐使用 Chrome 或 Edge

---

## 联系支持

如果以上方案都无法解决问题，请提供以下信息：

1. **系统信息**：
   - 操作系统版本
   - 浏览器版本
   - 显卡型号和驱动版本

2. **控制台输出**：
   - WebGPU Info 日志
   - 完整的错误堆栈

3. **WebGPU Report**：
   - 访问 https://webgpureport.com/
   - 提供报告链接

---

## 参考资料

- [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- [WebGPU Report](https://webgpureport.com/)
- [Chrome WebGPU 状态](https://chromestatus.com/feature/6213121689528320)
- [Taichi.js 官方文档](https://taichi-js.com)
