# 安全策略

## 运行时安全

### 内容安全策略 (CSP)
建议在生产环境中配置以下 CSP 头部：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com;
```

### 安全头部配置
```nginx
# Nginx 配置示例
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## 依赖安全

### 定期安全扫描
```bash
# 检查安全漏洞
npm audit

# 自动修复可修复的漏洞
npm audit fix

# 强制修复（包括破坏性更改）
npm audit fix --force
```

## 环境变量安全

### 敏感信息处理
- 切勿将 `.env.local` 提交到版本控制
- 生产环境密钥应使用安全的密钥管理服务
- 定期轮换 API 密钥和访问令牌

### 加密配置
项目使用 `crypto-js` 进行数据加密，生产环境应：
- 使用强密钥（至少 32 字符）
- 定期更换加密密钥
- 在后端验证加密数据

## API 安全

### 请求签名
启用请求加密后，所有 API 请求都会被签名验证：
```typescript
// .env
VITE_APP_API_ENCRYPT_ENABLE=true
```

### Token 管理
- Access Token 有效期建议 2 小时
- Refresh Token 有效期建议 7 天
- Token 应存储在 HttpOnly Cookie 或内存中

## XSS 防护

项目已集成 XSS 防护工具 `@/utils/xss.ts`：

```typescript
import { sanitizeHtml, vSafeHtml } from '@/utils/xss'

// 清理 HTML
const safeHtml = sanitizeHtml(userInput)

// 使用安全指令
<div v-safe-html="userContent"></div>
```

## 其他建议

1. **HTTPS**: 生产环境必须使用 HTTPS
2. **CSRF 防护**: 实施 CSRF Token 验证
3. **速率限制**: API 实施请求速率限制
4. **日志监控**: 配置安全事件日志和告警
5. **定期备份**: 重要数据定期备份
