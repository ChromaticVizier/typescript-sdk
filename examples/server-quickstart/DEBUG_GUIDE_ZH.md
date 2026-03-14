# MCP服务器调试指南 - 快速参考

## 🚀 快速开始调试

### 最快的方式：MCP Inspector（5分钟）

```bash
# 1. 进入项目目录
cd typescript-sdk/examples/server-quickstart

# 2. 安装依赖（首次）
pnpm install

# 3. 启动MCP Inspector
pnpm run inspector
```

**结果**: 浏览器会打开Web界面，可以：
- ✅ 查看所有可用工具（LED控制、屏幕消息、天气等）
- ✅ 实时调用工具并查看响应
- ✅ 测试参数是否正确
- ✅ 查看错误信息

---

## 🔧 5种调试方式

### 方式1: MCP Inspector（Web界面，最友好）

```bash
pnpm run inspector
```

**优点**：
- 最直观的界面
- 支持表单输入
- 实时请求/响应预览

**缺点**：
- 需要启动Web服务器

---

### 方式2: 开发模式运行（实时日志）

```bash
# 终端1：运行服务器
API_BASE_URL="https://mcp-server.fuufhjn.link" pnpm tsx src/index.ts

# 终端2：测试调用（如果有客户端连接）
# 或使用Claude Desktop连接
```

**优点**：
- 可以看到详细的控制台日志
- 支持热重载
- 便于开发

**日志输出示例**：
```
[DEBUG] control_led called with color=FF0000, brightness=200
LED call to: https://mcp-server.fuufhjn.link/api/led/color
Response: 200 OK
```

---

### 方式3: 使用Claude Desktop客户端

1. **编辑配置文件**

   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

2. **重启Claude Desktop**

3. **在聊天中测试**

   ```
   你: "把LED灯设置为红色，亮度200"
   Claude: [自动调用control_led工具]
   Claude: "已将LED灯设置为红色，亮度为200"
   ```

**优点**：
- 最接近实际使用场景
- 可以测试自然语言理解

**调试工具**：查看Claude Desktop的日志
- Windows: `%APPDATA%\Claude\logs\`
- macOS: `~/Library/Logs/Claude/`

---

### 方式4: curl命令测试（快速验证）

启动服务器后，可以直接测试后端API：

```bash
# 测试LED控制
curl -X POST https://mcp-server.fuufhjn.link/api/led/color \
  -H "Content-Type: application/json" \
  -d '{"color":"FF0000","brightness":200}'

# 测试屏幕显示
curl -X POST https://mcp-server.fuufhjn.link/api/screen/send \
  -H "Content-Type: application/json" \
  -d '{"content":"Test Message"}'

# 测试后端健康状态
curl https://mcp-server.fuufhjn.link/api/health
```

**优点**：
- 快速验证后端连接
- 不需要启动MCP服务器

**常见问题**：
```bash
# 连接被拒绝 → 后端服务未启动
# 返回404 → 检查API路径是否正确
# 返回500 → 检查后端日志
```

---

### 方式5: VS Code Cline扩展

1. **安装Cline扩展**
2. **配置settings.json**
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
3. **在Cline中使用**

---

## 🐛 常见问题排查

### 问题1: "后端连接失败"

**症状**: 工具返回 `❌ 发送失败: HTTP 5xx`

**排查步骤**:

```bash
# 1. 检查后端服务是否在线
curl https://mcp-server.fuufhjn.link/api/health

# 2. 检查API端点
curl -X POST https://mcp-server.fuufhjn.link/api/led/color \
  -H "Content-Type: application/json" \
  -d '{"color":"FF0000","brightness":200}' -v

# 3. 查看详细错误
# 如果收到错误，记下状态码和消息

# 4. 尝试本地测试（如果后端在本地运行）
curl http://localhost:8787/api/led/color \
  -H "Content-Type: application/json" \
  -d '{"color":"FF0000","brightness":200}'
```

**解决方案**:
- ✅ 确认后端服务已启动
- ✅ 检查 `API_BASE_URL` 环境变量是否正确
- ✅ 查看后端日志了解具体错误

---

### 问题2: "找不到工具"

**症状**: MCP Inspector中看不到 `control_led` 或 `send_screen_message`

**排查步骤**:

```bash
# 1. 检查index.ts中是否注册了工具
grep -n "registerTool" src/index.ts

# 2. 确保工具注册在main()之前
# 应该在 //#endregion registerTools 之前

# 3. 重新构建
pnpm build

# 4. 重启服务器
pnpm run inspector
```

**解决方案**:
- ✅ 检查拼写（区分大小写）
- ✅ 确保没有被注释掉
- ✅ 验证inputSchema格式正确

---

### 问题3: "参数验证失败"

**症状**: `❌ 颜色格式错误，必须是6位十六进制颜色值`

**排查步骤**:

```typescript
// 在src/index.ts中添加调试日志
async ({ color, brightness }) => {
  console.error(`[DEBUG] Received color: "${color}" (${color.length} chars)`);
  console.error(`[DEBUG] Received brightness: ${brightness} (type: ${typeof brightness})`);
  // ...
}
```

**常见的参数错误**:

```
❌ 错误的颜色格式:
  "FF000"      // 太短
  "FF00000"    // 太长
  "GG0000"     // 无效的十六进制字符
  "FF/0000"    // 有特殊字符

✅ 正确的格式:
  "FF0000"     // 标准格式
  "#FF0000"    // 带#前缀
  "ff0000"     // 小写也可以

❌ 错误的亮度:
  "200"        // 字符串，应该是数字
  300          // 超过255
  -10          // 负数

✅ 正确的亮度:
  200          // 数字
  0            // 关闭
  255          // 最亮
```

---

### 问题4: "MCP Inspector无法连接到服务器"

**症状**: "Failed to connect to server"

**解决方案**:

```bash
# 1. 确保在正确的目录
cd typescript-sdk/examples/server-quickstart

# 2. 检查依赖是否已安装
pnpm install

# 3. 检查是否有其他进程占用端口
# Inspector通常使用3000端口
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 4. 尝试指定其他端口
pnpm tsx node_modules/.bin/@modelcontextprotocol/inspector dist/index.js --port 3001

# 5. 清理重建
rm -rf dist node_modules
pnpm install
pnpm build
pnpm run inspector
```

---

### 问题5: "工具执行超时"

**症状**: 工具调用后长时间无响应

**排查步骤**:

```typescript
// 添加超时检测
async ({ color, brightness }) => {
  const startTime = Date.now();
  console.error(`[DEBUG] Tool start time: ${startTime}`);
  
  try {
    const response = await Promise.race([
      fetch(`${API_BASE_URL}/api/led/color`, { /* ... */ }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
      )
    ]);
    
    console.error(`[DEBUG] Tool execution time: ${Date.now() - startTime}ms`);
    // ...
  } catch (error) {
    console.error(`[DEBUG] Error:`, error);
    // ...
  }
}
```

**常见原因**:
- 后端服务响应慢
- 网络连接问题
- 防火墙阻止

---

## 📊 性能调试

### 测量工具执行时间

```typescript
async ({ color, brightness }) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/led/color`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color, brightness }),
    });
    
    const elapsed = performance.now() - startTime;
    console.error(`[PERF] LED control took ${elapsed.toFixed(2)}ms`);
    
    // ...
  }
}
```

**性能参考**:
- ✅ 正常: < 500ms
- ⚠️ 慢: 500ms - 2s
- ❌ 超时: > 2s

---

## 🔍 高级调试技巧

### 1. 启用TypeScript source maps

```bash
# 构建时保留source maps
pnpm build  # 已默认启用

# 运行时使用
node --enable-source-maps dist/index.js
```

### 2. 监控网络流量

```bash
# 使用mitmproxy或Charles进行中间人代理
# 或在工具中添加请求日志
async ({ color, brightness }) => {
  console.error('[REQUEST]', {
    url: `${API_BASE_URL}/api/led/color`,
    method: 'POST',
    body: { color, brightness }
  });
}
```

### 3. 单元测试工具

```bash
# 创建test.ts
import { server } from './index';

// 测试LED工具
const result = await server.callTool('control_led', {
  color: 'FF0000',
  brightness: 200
});

console.log(result);
```

---

## 🎯 调试流程图

```
┌─────────────────────┐
│  问题现象          │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
  工具未找到   工具异常
      │          │
      │      ┌───┴───┐
      │      │       │
      ▼      ▼       ▼
   参数错   网络错  后端错
      │      │       │
      └──────┴───────┘
             │
             ▼
      ┌─────────────────┐
      │  查阅本指南     │
      │  对应部分       │
      └─────────────────┘
```

---

## 📞 获取帮助

### 检查清单

- [ ] 后端服务已启动？ (`curl https://api-url/api/health`)
- [ ] 环境变量已设置？ (`echo $API_BASE_URL`)
- [ ] 依赖已安装？ (`pnpm install`)
- [ ] 代码已编译？ (`pnpm build`)
- [ ] 工具名称拼写正确？ (检查大小写)
- [ ] 参数格式正确？ (检查类型和范围)

### 有用的日志命令

```bash
# 启用详细日志
DEBUG=* pnpm tsx src/index.ts

# 查看特定工具的日志
grep -A 5 "control_led" src/index.ts

# 监控后端日志
tail -f backend.log | grep "api/led"
```

---

**最后更新**: 2026-03-12  
**版本**: 1.0.0
