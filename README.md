# NPM MCP Cloudflare Worker

[![smithery badge](https://smithery.ai/badge/@mateusribeirocampos/npm-mcp-server)](https://smithery.ai/server/@mateusribeirocampos/npm-mcp-server)

基于Cloudflare Workers的npm包搜索服务，提供Model Context Protocol(MCP)接口。

## 核心功能

1. **包详情查询**：通过包名获取npm包详细信息
2. **包搜索**：通过关键词搜索npm包，支持多种排序选项
3. **下载统计**：获取npm包的下载统计信息
4. **实时通信**：支持SSE协议实时推送数据
5. **缓存机制**：内置缓存机制，提高响应速度

## 路由端点

- `GET /mcp`：MCP协议主入口
- `GET /sse`：SSE实时通信通道

## 使用示例

### 查询包详情
```typescript
const result = await fetch('/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'searchNpmPackage',
    parameters: { packageName: 'react' }
  })
});
```

### 搜索npm包
```typescript
const result = await fetch('/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'searchNpmPackages',
    parameters: { query: 'http client' }
  })
});
```

### 搜索npm包（带选项）
```typescript
const result = await fetch('/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'searchNpmPackages',
    parameters: {
      query: 'http client',
      size: 20,
      sortBy: 'downloads',
      popularity: 1.0
    }
  })
});
```

### 获取包下载统计
```typescript
const result = await fetch('/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'getDownloadStats',
    parameters: {
      packageName: 'react',
      period: 'last-month'
    }
  })
});
```

### 实时通信(SSE)
```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = (event) => {
  console.log('收到数据:', JSON.parse(event.data));
};
```

## 部署到Cloudflare

1. 安装依赖
```bash
npm install
```

2. 构建项目
```bash
npm run build
```

3. 发布Worker
```bash
npx wrangler deploy
```

## 自定义域名配置

### 1. Cloudflare控制台配置
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择对应域名的DNS管理页面
3. 添加CNAME记录：
   - 名称: `npm.mcp` (或你选择的子域名)
   - 目标: `<worker-name>.<account-subdomain>.workers.dev`
   - 代理状态: 橙色云朵(已代理)

### 2. Worker自定义域配置
在 `wrangler.jsonc` 中添加路由配置：
```json
{
  "routes": [
    {
      "pattern": "npm.mcp.yourdomain.com",
      "custom_domain": true
    }
  ]
}
```

### 3. 重新部署
```bash
wrangler deploy
```

### 4. 验证域名
访问 `https://npm.mcp.yourdomain.com/mcp` 测试是否正常工作

## 开发模式

```bash
wrangler dev
```

## 技术栈

- Cloudflare Workers
- TypeScript
- Model Context Protocol
- Server-Sent Events(SSE)

## 性能优化

- **缓存机制**：内置5分钟缓存，减少对npm registry的重复请求
- **错误处理**：提供详细的错误信息和日志记录
- **速率限制**：智能处理npm registry的速率限制
