# 智能家居MCP服务器 - 官方SDK改进版

> 📌 **本项目是对官方 `server-quickstart` 示例的改进**  
> 在保留原有天气工具的基础上，添加了LED灯控制和屏幕显示功能。

## ✨ 新增功能

### 🔴 LED灯控制 (control_led)

设置WS2812 RGB LED灯的颜色和亮度

```bash
# 示例：设置红色，亮度200
LLM调用: "把灯设置为红色，亮度200"
```

| 参数 | 类型 | 范围 | 说明 |
|------|------|------|------|
| color | string | `#?[0-9A-Fa-f]{6}` | RGB颜色值 |
| brightness | number | 0-255 | 亮度 |

### 📺 屏幕显示 (send_screen_message)

向OLED屏幕发送文本消息

```bash
# 示例：显示消息
LLM调用: "在屏幕上显示欢迎回家"
```

| 参数 | 类型 | 说明 |
|------|------|------|
| content | string | 消息内容 |

## 🚀 快速开始

### 1. 安装依赖

```bash
cd typescript-sdk/examples/server-quickstart
pnpm install
```

### 2. 运行服务器

```bash
# 开发模式
pnpm tsx src/index.ts

# 或使用Inspector进行可视化调试
pnpm run inspector
```

### 3. 配置后端URL

```bash
# 设置环境变量（默认已配置为生产环境）
export API_BASE_URL="https://mcp-server.fuufhjn.link"
```

### 4. 在Claude Desktop中使用

编辑 `~/.config/Claude/claude_desktop_config.json` (Linux/macOS) 或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)：

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

然后重启Claude Desktop，即可在聊天中使用这些工具。

## 📖 完整文档

本项目包含两份详细的中文文档：

### 📚 [SMART_HOME_GUIDE_ZH.md](./SMART_HOME_GUIDE_ZH.md)

**内容**：
- 完整的功能介绍
- 工具参数详解
- 使用示例
- Claude Desktop配置
- VS Code Cline集成
- 常见问题解答
- 进阶主题

**适合**：第一次使用的用户

### 🔧 [DEBUG_GUIDE_ZH.md](./DEBUG_GUIDE_ZH.md)

**内容**：
- 5种调试方式
- MCP Inspector快速开始
- 常见问题排查
- 性能调试
- 高级技巧

**适合**：需要调试或遇到问题的开发者

## 🏗️ 代码改动

### 修改的文件

- `src/index.ts` - 添加LED和屏幕控制工具

### 关键代码片段

**LED控制工具**
```typescript
server.registerTool(
  'control_led',
  {
    title: '控制LED灯',
    description: '设置WS2812 RGB LED灯的颜色和亮度',
    inputSchema: z.object({
      color: z.string().regex(/^#?[0-9A-Fa-f]{6}$/),
      brightness: z.number().min(0).max(255).int(),
    }),
  },
  async ({ color, brightness }) => {
    // 调用后端API: POST /api/led/color
    // 返回成功/错误消息
  },
);
```

**屏幕显示工具**
```typescript
server.registerTool(
  'send_screen_message',
  {
    title: '发送消息到屏幕',
    description: '向OLED屏幕设备发送文本消息',
    inputSchema: z.object({
      content: z.string(),
    }),
  },
  async ({ content }) => {
    // 调用后端API: POST /api/screen/send
    // 返回成功/错误消息
  },
);
```

## 🔌 后端集成

该服务器通过HTTP API与后端服务通信：

| 工具 | 方法 | 端点 | 请求体 |
|------|------|------|--------|
| control_led | POST | `/api/led/color` | `{color, brightness}` |
| send_screen_message | POST | `/api/screen/send` | `{content}` |

环境变量 `API_BASE_URL` 可配置后端地址（默认：`https://mcp-server.fuufhjn.link`）

## 📊 测试

### 使用MCP Inspector测试

```bash
pnpm run inspector
```

打开浏览器访问Web界面，可以：
- 查看所有可用工具
- 测试工具参数
- 查看请求/响应

### 使用curl测试

```bash
# 测试LED控制
curl -X POST https://mcp-server.fuufhjn.link/api/led/color \
  -H "Content-Type: application/json" \
  -d '{"color":"FF0000","brightness":200}'

# 测试屏幕显示
curl -X POST https://mcp-server.fuufhjn.link/api/screen/send \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello"}'
```

## 🛠️ 添加更多工具

要添加新工具，在 `src/index.ts` 中的天气工具后面添加：

```typescript
server.registerTool(
  'tool_name',
  {
    title: 'Tool Title',
    description: 'Tool Description',
    inputSchema: z.object({
      param: z.string().describe('Parameter description'),
    }),
  },
  async ({ param }) => {
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

## 📝 项目结构

```
typescript-sdk/examples/server-quickstart/
├── src/
│   └── index.ts                    # 主要实现文件（包含LED和屏幕工具）
├── dist/                           # 编译输出
├── package.json                    # 项目配置
├── tsconfig.json                   # TypeScript配置
├── README_SMART_HOME_ZH.md         # 本文件
├── SMART_HOME_GUIDE_ZH.md         # 完整使用指南
└── DEBUG_GUIDE_ZH.md              # 调试指南
```

## 🔗 相关链接

- [官方MCP文档](https://modelcontextprotocol.io/)
- [TypeScript SDK仓库](https://github.com/modelcontextprotocol/typescript-sdk)
- [原始server-quickstart示例](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples/server-quickstart)

## 📋 原始README

本项目继承自官方 `server-quickstart` 示例。如需了解原始天气工具的使用，请参考：

```bash
cat README.md
```

## 🤝 贡献

欢迎提交问题和改进建议！

## 📄 许可证

ISC License (继承自官方SDK)

---

**版本**: 1.0.0  
**最后更新**: 2026-03-12  
**作者**: Smart Home MCP Team

---

## 快速命令参考

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm tsx src/index.ts

# 使用Inspector调试
pnpm run inspector

# 构建项目
pnpm build

# 运行构建后的代码
pnpm start

# 查看环境变量
echo $API_BASE_URL

# 测试后端连接
curl https://mcp-server.fuufhjn.link/api/health
```

---

## 常见快速解答

**Q: 如何修改后端地址？**  
A: 设置 `API_BASE_URL` 环境变量

**Q: 如何调试工具？**  
A: 使用 `pnpm run inspector` 启动Web调试界面

**Q: 如何在Claude中使用？**  
A: 配置Claude Desktop的config文件，参考文档中的步骤

**Q: 遇到问题怎么办？**  
A: 查看 `DEBUG_GUIDE_ZH.md` 中的问题排查部分

**需要更多帮助？** → 查看 `SMART_HOME_GUIDE_ZH.md` 完整文档
