# 官方SDK智能家居MCP服务器 - 完整中文指南

## 📖 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [工具详解](#工具详解)
4. [调试指南](#调试指南)
5. [部署指南](#部署指南)
6. [常见问题](#常见问题)

---

## 概述

本指南基于**官方TypeScript SDK的server-quickstart示例**，展示如何添加智能家居控制功能（LED灯和屏幕显示）。

### 核心特性

✅ **基于官方SDK** - 使用最新的MCP TypeScript SDK  
✅ **两个智能家居工具** - LED控制 + 屏幕显示  
✅ **完整的参数验证** - 使用Zod进行类型安全验证  
✅ **后端集成** - 通过HTTP API调用后端服务  
✅ **错误处理** - 详细的错误提示和日志  

### 架构

```
┌─────────────────────┐
│   LLM Client        │
│  (Claude/其他)      │
└──────────┬──────────┘
           │
           │ MCP协议 (stdio)
           ▼
┌─────────────────────┐
│  MCP Server         │
│ (server-quickstart) │
│  - control_led      │
│  - send_screen_msg  │
│  - get_forecast     │
│  - get_alerts       │
└──────────┬──────────┘
           │
           │ HTTP API
           ▼
┌─────────────────────┐
│  后端服务           │
│ /api/led/color      │
│ /api/screen/send    │
└─────────────────────┘
```

---

## 快速开始

### 前置条件

- Node.js 16+ 
- pnpm (或 npm/yarn)
- 官方TypeScript SDK已安装

### 1. 安装依赖

```bash
cd typescript-sdk/examples/server-quickstart
pnpm install
```

### 2. 配置后端URL

设置环境变量指向你的后端服务：

```bash
# Linux/macOS
export API_BASE_URL="https://mcp-server.fuufhjn.link"

# Windows (cmd)
set API_BASE_URL=https://mcp-server.fuufhjn.link

# Windows (PowerShell)
$env:API_BASE_URL="https://mcp-server.fuufhjn.link"
```

默认值已设置为 `https://mcp-server.fuufhjn.link`，可按需修改。

### 3. 运行服务器

```bash
# 开发模式 (使用tsx，支持TypeScript热重载)
pnpm tsx src/index.ts

# 或构建后运行
pnpm build
pnpm start
```

### 4. 测试连接

在另一个终端使用MCP Inspector测试：

```bash
pnpm run inspector
```

这将打开一个Web界面，可以实时测试所有工具。

---

## 工具详解

### 工具1: 控制LED灯 (control_led)

**功能**: 设置WS2812 RGB LED灯的颜色和亮度

#### 参数

| 参数名 | 类型 | 范围 | 说明 |
|-------|------|------|------|
| `color` | string | `#?[0-9A-Fa-f]{6}` | RGB十六进制颜色值，可选`#`前缀 |
| `brightness` | number | 0-255 | 亮度值（0=关闭，255=最亮） |

#### 颜色示例

```
FF0000 - 红色
00FF00 - 绿色
0000FF - 蓝色
FFFF00 - 黄色
FF00FF - 品红色
00FFFF - 青色
FFFFFF - 白色
000000 - 关闭
```

#### 使用示例

**自然语言示例（给Claude/其他LLM）**

```
"把灯调成红色，亮度设置为200"
"开启蓝色灯光，50%亮度"
"关闭LED灯"
```

**JSON请求示例**

```json
{
  "tool": "control_led",
  "arguments": {
    "color": "#FF0000",
    "brightness": 200
  }
}
```

**响应示例**

成功：
```json
{
  "content": [{
    "type": "text",
    "text": "✅ LED灯已设置为颜色 #FF0000，亮度 200"
  }]
}
```

错误：
```json
{
  "content": [{
    "type": "text",
    "text": "❌ LED控制失败: HTTP 500"
  }]
}
```

---

### 工具2: 发送消息到屏幕 (send_screen_message)

**功能**: 向OLED屏幕设备发送文本消息

#### 参数

| 参数名 | 类型 | 说明 |
|-------|------|------|
| `content` | string | 要显示的文本内容（不能为空） |

#### 使用示例

**自然语言示例**

```
"在屏幕上显示欢迎回家"
"屏幕显示当前温度25度"
"显示一条通知消息"
```

**JSON请求示例**

```json
{
  "tool": "send_screen_message",
  "arguments": {
    "content": "欢迎回家"
  }
}
```

**响应示例**

成功：
```json
{
  "content": [{
    "type": "text",
    "text": "✅ 消息已成功发送到屏幕: \"欢迎回家\""
  }]
}
```

错误：
```json
{
  "content": [{
    "type": "text",
    "text": "❌ 消息内容不能为空"
  }]
}
```

---

## 调试指南

### 方式1: MCP Inspector (推荐)

最方便的调试方式，提供完整的Web界面。

```bash
pnpm run inspector
```

**功能**：
- ✅ 实时查看所有可用工具
- ✅ 直观的表单输入
- ✅ 完整的请求/响应显示
- ✅ 错误信息详细展示

### 方式2: 命令行测试

直接通过stdin/stdout测试（模拟LLM客户端）：

```bash
# 启动服务器
pnpm tsx src/index.ts

# 在另一个终端发送测试请求
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"control_led","arguments":{"color":"FF0000","brightness":200}}}' | node -e "
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', line => {
    process.stdout.write(line);
  });
"
```

### 方式3: 使用Claude Desktop客户端

配置你的Claude Desktop来使用本MCP服务器：

#### Windows

编辑 `%APPDATA%\Claude\claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "smart-home": {
      "command": "pnpm",
      "args": ["tsx", "C:\\path\\to\\typescript-sdk\\examples\\server-quickstart\\src\\index.ts"],
      "env": {
        "API_BASE_URL": "https://mcp-server.fuufhjn.link"
      }
    }
  }
}
```

#### macOS

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "smart-home": {
      "command": "pnpm",
      "args": ["tsx", "/path/to/typescript-sdk/examples/server-quickstart/src/index.ts"],
      "env": {
        "API_BASE_URL": "https://mcp-server.fuufhjn.link"
      }
    }
  }
}
```

#### 测试

配置后重启Claude Desktop，在聊天中使用自然语言：

```
你: "把屏幕显示为蓝色，亮度设为100"
Claude: [使用控制_led工具]
Claude: "我已经把LED灯设置为蓝色，亮度为100"
```

### 方式4: VS Code Cline扩展

在VS Code的Cline扩展中配置MCP服务器：

```json
{
  "cline.mcpServers": {
    "smart-home": {
      "command": "pnpm",
      "args": ["tsx", "/path/to/typescript-sdk/examples/server-quickstart/src/index.ts"],
      "env": {
        "API_BASE_URL": "https://mcp-server.fuufhjn.link"
      }
    }
  }
}
```

### 调试技巧

#### 启用详细日志

修改 `src/index.ts`，在工具执行前添加日志：

```typescript
async ({ color, brightness }) => {
  console.error(`[DEBUG] control_led called with color=${color}, brightness=${brightness}`);
  try {
    // ... 实现代码
  } catch (error) {
    console.error(`[DEBUG] control_led error:`, error);
    // ...
  }
}
```

#### 检查网络连接

```bash
# 测试后端API是否可访问
curl -X GET https://mcp-server.fuufhjn.link/api/health

# 测试LED控制端点
curl -X POST https://mcp-server.fuufhjn.link/api/led/color \
  -H "Content-Type: application/json" \
  -d '{"color":"FF0000","brightness":200}'

# 测试屏幕显示端点
curl -X POST https://mcp-server.fuufhjn.link/api/screen/send \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello World"}'
```

#### 查看MCP协议日志

增加更详细的日志记录（在main函数中）：

```typescript
async function main() {
  const transport = new StdioServerTransport();
  
  // 添加错误处理
  transport.onclose = () => {
    console.error('Transport closed');
    process.exit(0);
  };
  
  transport.onerror = (error: any) => {
    console.error('Transport error:', error);
  };
  
  await server.connect(transport);
  console.error('MCP Server started and connected');
}
```

---

## 部署指南

### 1. 本地部署

适用于开发和测试。

```bash
cd typescript-sdk/examples/server-quickstart
pnpm install
pnpm build
API_BASE_URL="https://your-api.com" pnpm start
```

### 2. Docker部署

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制SDK到容器
COPY typescript-sdk ./sdk
COPY typescript-sdk/examples/server-quickstart ./app

WORKDIR /app

RUN npm install -g pnpm
RUN pnpm install

RUN pnpm build

# 暴露stdio端口（如果使用HTTP传输）
EXPOSE 3000

ENV API_BASE_URL=https://mcp-server.fuufhjn.link

CMD ["pnpm", "start"]
```

构建和运行：

```bash
docker build -t smart-home-mcp .
docker run -e API_BASE_URL=https://your-api.com smart-home-mcp
```

### 3. 生产环境建议

```bash
# 使用PM2进行进程管理
pnpm install -g pm2

pm2 start "pnpm start" \
  --name "smart-home-mcp" \
  --env API_BASE_URL="https://mcp-server.fuufhjn.link" \
  --instances 1

pm2 save
pm2 startup
```

---

## 常见问题

### Q1: 如何添加更多工具？

在 `src/index.ts` 中的 `//#endregion registerTools` 前添加新工具：

```typescript
server.registerTool(
  'your_tool_name',
  {
    title: '工具标题',
    description: '工具描述',
    inputSchema: z.object({
      param1: z.string().describe('参数1说明'),
    }),
  },
  async ({ param1 }) => {
    // 实现逻辑
    return {
      content: [{
        type: 'text' as const,
        text: '结果',
      }],
    };
  },
);
```

### Q2: 如何处理工具的异步操作？

工具的处理函数支持async/await，所有异步操作都应该等待：

```typescript
async ({ param1 }) => {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  return { content: [{ type: 'text', text: JSON.stringify(json) }] };
}
```

### Q3: 如何访问环境变量？

直接使用 `process.env`：

```typescript
const API_KEY = process.env.API_KEY || 'default_key';
const DEBUG = process.env.DEBUG === 'true';
```

### Q4: 后端API返回错误如何处理？

在catch块中处理：

```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  // ...
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  return {
    content: [{
      type: 'text' as const,
      text: `❌ 操作失败: ${msg}`,
    }],
  };
}
```

### Q5: 如何测试特定的工具参数组合？

使用MCP Inspector，在表单中输入参数值，直接点击"Call Tool"测试。

或使用curl命令：

```bash
# 测试LED控制
curl -X POST http://localhost:3000/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "control_led",
    "arguments": {
      "color": "FF0000",
      "brightness": 150
    }
  }'
```

### Q6: 如何在Claude中使用这个MCP服务器？

1. 配置Claude Desktop的config文件
2. 重启Claude Desktop
3. 在聊天中使用自然语言，Claude会自动调用合适的工具

### Q7: 工具返回的content字段是什么格式？

MCP标准要求返回数组，每项包含type和text/image等字段：

```typescript
return {
  content: [
    {
      type: 'text' as const,
      text: '文本内容',
    },
    // 可以有多个content项
  ],
};
```

### Q8: 如何debug工具为什么没被调用？

1. 检查工具名称拼写是否正确
2. 查看MCP Inspector中工具列表是否包含你的工具
3. 查看服务器的stderr日志
4. 确保inputSchema的参数名称正确

---

## 进阶话题

### 自定义参数验证

使用Zod的更高级特性：

```typescript
inputSchema: z.object({
  color: z.string()
    .regex(/^#?[0-9A-Fa-f]{6}$/)
    .transform(c => c.replace(/^#/, '').toUpperCase())
    .describe('颜色值'),
  brightness: z.number()
    .min(0)
    .max(255)
    .int()
    .refine(n => n % 5 === 0, '亮度必须是5的倍数')
    .describe('亮度值'),
})
```

### 工具之间的数据共享

使用闭包保存状态：

```typescript
const toolState = new Map();

server.registerTool('save_state', {
  // ...
  async ({ key, value }) => {
    toolState.set(key, value);
    return { content: [{ type: 'text', text: `已保存${key}` }] };
  },
});

server.registerTool('get_state', {
  // ...
  async ({ key }) => {
    const value = toolState.get(key);
    return { content: [{ type: 'text', text: value || '未找到' }] };
  },
});
```

### 与多个后端服务集成

```typescript
const services = {
  led: 'https://led-service.example.com',
  screen: 'https://screen-service.example.com',
  telemetry: 'https://telemetry-service.example.com',
};

async function callService(name: string, endpoint: string, options: any) {
  const url = `${services[name]}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Service error: ${response.status}`);
  return response.json();
}
```

---

## 参考资源

- [官方MCP文档](https://modelcontextprotocol.io/)
- [TypeScript SDK仓库](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod验证库文档](https://zod.dev/)

---

**文档版本**: 1.0.0  
**最后更新**: 2026-03-12  
**作者**: Smart Home MCP Team
