# MCP服务器架构设计 - MQTT集成与前端交互指南

## 📌 概述

本文档说明如何在现有MCP服务器中集成MQTT通信，以及如何构建前端界面来实时交互所有工具。

**三个主要场景**：
1. ✅ 当前实现 - 工具直接调用后端HTTP API
2. 🔄 新增需求 - 直接在MCP服务器中集成MQTT通信
3. 🖥️ 新增需求 - 前端实时查看和交互所有工具

---

## 🏗️ 架构演变

### 场景1：当前架构（HTTP API方式）

```
┌──────────────────┐
│   LLM客户端      │
│  (Claude等)      │
└────────┬─────────┘
         │ MCP协议
         ▼
┌──────────────────────────────────┐
│  MCP服务器                       │
│  (server-quickstart/index.ts)    │
│                                  │
│  工具1: control_led              │
│  工具2: send_screen_message      │
└────────┬─────────────────────────┘
         │ HTTP API
         ▼
┌──────────────────────────────────┐
│  后端服务 (mcp-server/backend)   │
│  /api/led/color                  │
│  /api/screen/send                │
└────────┬─────────────────────────┘
         │ MQTT
         ▼
┌──────────────────────────────────┐
│  MQTT Broker                     │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│  LED设备 │ │ 屏幕设备 │
└─────────┘ └──────────┘
```

**现在的代码位置**：
- 文件：`src/index.ts` 或 `src/cloudflare-worker.ts`
- 工具实现处：工具注册函数中的 `async ({ color, brightness })` 或 `async ({ content })`
- 当前调用：`fetch('${API_BASE_URL}/api/led/color', ...)`

---

### 场景2：MQTT集成架构（推荐方案）

```
┌──────────────────┐
│   LLM客户端      │
│  (Claude等)      │
└────────┬─────────┘
         │ MCP协议
         ▼
┌──────────────────────────────────┐
│  MCP服务器 (改进版)              │
│                                  │
│  ├─ 工具定义                     │
│  │  ├─ control_led               │
│  │  └─ send_screen_message       │
│  │                               │
│  └─ MQTT客户端 (新增)            │
│     ├─ 连接MQTT Broker           │
│     └─ 直接发布消息到设备        │
└────────┬─────────────────────────┘
         │ MQTT协议 (直接)
         ▼
┌──────────────────────────────────┐
│  MQTT Broker                     │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│  LED设备 │ │ 屏幕设备 │
└─────────┘ └──────────┘

【可选】后端服务仍可用于其他功能
```

**优势**：
- ⚡ 降低延迟 - 不需要经过后端HTTP API
- 🔄 实时性更好 - 直接MQTT通信
- 🎯 解耦架构 - MCP服务器独立运行
- 📊 便于监控 - 可同时连接前端和LLM客户端

---

### 场景3：前端交互架构（完整方案）

```
┌─────────────────────────────────────────────────────────────┐
│                     Web浏览器                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  前端应用 (React/Vue等)                              │  │
│  │  ├─ 工具列表面板                                    │  │
│  │  ├─ 参数输入表单                                    │  │
│  │  ├─ 实时执行结果                                    │  │
│  │  └─ WebSocket/SSE连接接收状态                       │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
        ┌─────────────────────────────┐
        │  后端API服务 (新增端点)     │
        │                             │
        │  GET /api/mcp/tools         │
        │  ├─ 获取所有工具列表        │
        │  └─ 获取工具参数schema      │
        │                             │
        │  POST /api/mcp/tools/:name  │
        │  ├─ 调用指定工具            │
        │  └─ 传递参数                │
        │                             │
        │  GET /api/mcp/tools/:name   │
        │  ├─ 获取工具详情            │
        │  └─ 获取执行历史            │
        └────────┬────────────────────┘
                 │ RPC调用
                 ▼
        ┌─────────────────────────────┐
        │  MCP服务器                  │
        │  (stdio或HTTP方式)          │
        └────────┬────────────────────┘
                 │ MQTT或HTTP
                 ▼
        ┌─────────────────────────────┐
        │  设备控制                   │
        │  ├─ LED灯                   │
        │  └─ 屏幕                    │
        └─────────────────────────────┘
```

**前端功能**：
- 📋 实时显示所有可用工具
- 📝 动态表单：根据工具参数自动生成
- ⚡ 一键执行：点击调用工具
- 📊 结果展示：实时显示执行结果
- 📈 历史记录：保存执行历史

---

## 🔧 具体实现位置

### 第一步：添加MQTT客户端到MCP服务器

#### 位置A：`src/index.ts` 或 `src/cloudflare-worker.ts` 顶部

```
在这里添加：

1. 导入MQTT库
   import mqtt from 'mqtt';  // 或 import { connect } from 'mqtt'

2. 创建MQTT客户端配置
   const mqttConfig = {
     host: process.env.MQTT_BROKER || 'mqtt.example.com',
     port: Number(process.env.MQTT_PORT || 1883),
     username: process.env.MQTT_USER,
     password: process.env.MQTT_PASSWORD
   };

3. 初始化MQTT客户端
   let mqttClient: mqtt.MqttClient | null = null;
   
   async function connectMQTT() {
     return new Promise((resolve, reject) => {
       mqttClient = mqtt.connect(mqttConfig);
       mqttClient.on('connect', resolve);
       mqttClient.on('error', reject);
     });
   }
```

#### 位置B：`src/index.ts` 或 `src/cloudflare-worker.ts` 工具实现中

**对于control_led工具**：

```
修改点：在 server.registerTool('control_led', ...) 的处理函数中

当前代码：
async ({ color, brightness }) => {
  const response = await fetch(`${API_BASE_URL}/api/led/color`, {
    // HTTP调用
  });
}

改为：
async ({ color, brightness }) => {
  // 方案1：直接发布到MQTT
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish('device/led/control', JSON.stringify({
      color,
      brightness,
      timestamp: Date.now()
    }));
    
    return {
      content: [{
        type: 'text',
        text: `✅ LED命令已发送: 颜色#${color}, 亮度${brightness}`
      }]
    };
  }
  
  // 方案2：回退到HTTP调用（如果MQTT不可用）
  return await callViaHttp(color, brightness);
}
```

**对于send_screen_message工具**：

```
修改点：在 server.registerTool('send_screen_message', ...) 的处理函数中

当前代码：
async ({ content }) => {
  const response = await fetch(`${API_BASE_URL}/api/screen/send`, {
    // HTTP调用
  });
}

改为：
async ({ content }) => {
  // 发布到MQTT
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish('device/screen/message', JSON.stringify({
      content,
      timestamp: Date.now()
    }));
    
    return {
      content: [{
        type: 'text',
        text: `✅ 屏幕消息已发送: "${content}"`
      }]
    };
  }
  
  // 回退到HTTP
  return await callViaHttp(content);
}
```

---

### 第二步：创建前端API端点

#### 位置C：后端新增路由文件 `mcp-server/backend/src/routes/mcp-interface.ts`

```
创建新文件用于MCP交互接口：

1. 获取工具列表端点
   GET /api/mcp/tools
   ├─ 返回格式: { tools: [{ name, title, description, inputSchema }] }
   └─ 通过RPC调用MCP服务器获取

2. 调用工具端点
   POST /api/mcp/tools/:toolName
   ├─ 请求体: { arguments: { ...参数 } }
   ├─ 响应: { content: [{ type, text }] }
   └─ 通过RPC调用MCP服务器执行工具

3. 获取工具详情端点
   GET /api/mcp/tools/:toolName
   ├─ 返回: 工具完整信息 + schema
   └─ 用于前端生成表单

4. 获取执行历史端点
   GET /api/mcp/tools/:toolName/history
   ├─ 返回: 最近的执行记录
   └─ 存储在数据库中
```

---

### 第三步：构建前端应用

#### 位置D：前端项目新增组件 `mcp-server/frontend/src/pages/MCPTools.tsx`

```
创建MCPTools组件：

1. 组件结构
   ├─ ToolList 组件
   │  ├─ 从API获取工具列表
   │  ├─ 显示所有可用工具
   │  └─ 选择要执行的工具
   │
   ├─ ToolForm 组件
   │  ├─ 根据inputSchema动态生成表单
   │  ├─ 显示参数输入框
   │  └─ 提交执行请求
   │
   ├─ ResultDisplay 组件
   │  ├─ 显示执行结果
   │  ├─ 实时更新状态
   │  └─ 显示错误信息
   │
   └─ HistoryPanel 组件
      ├─ 显示执行历史记录
      ├─ 允许重新执行
      └─ 导出执行日志

2. 数据流
   ① 页面加载 → 获取工具列表
   ② 用户选择工具 → 获取工具schema
   ③ 用户填写表单 → 验证参数
   ④ 用户提交 → POST到/api/mcp/tools/:name
   ⑤ 显示结果 → 更新历史记录

3. 实时更新方式
   选项A：轮询 (polling)
   - 每秒请求一次状态
   - 简单但浪费资源
   
   选项B：WebSocket
   - 建立长连接
   - 服务器主动推送
   - 推荐方案
   
   选项C：Server-Sent Events (SSE)
   - 单向推送
   - 更轻量级
```

---

## 📋 修改清单

### 必须修改

| 文件 | 操作 | 用途 |
|------|------|------|
| `src/index.ts` | 添加MQTT客户端初始化 | 支持MQTT通信 |
| `src/index.ts` | 修改工具处理函数 | 使用MQTT发送命令 |
| `mcp-server/backend/src/routes/mcp-interface.ts` | 创建新文件 | 前端API接口 |
| `mcp-server/frontend/src/pages/MCPTools.tsx` | 创建新文件 | 前端UI组件 |

### 可选修改

| 文件 | 操作 | 用途 |
|------|------|------|
| `package.json` | 添加`mqtt`依赖 | MQTT支持 |
| `.env.example` | 添加MQTT配置示例 | 环境变量文档 |
| `mcp-server/backend/src/index.ts` | 新增MCP路由 | 前端API支持 |

---

## 🔄 数据流说明

### 工作流1：MQTT直接集成（推荐）

```
用户在Claude中：
"把LED灯设置为红色"
        │
        ▼
MCP服务器识别 control_led 工具
        │
        ▼
执行工具处理函数
        │
    ┌───┴───┐
    │       │
MQTT可用? ──是→ mqttClient.publish('device/led/control', {...})
    │       
    否
    │
    └──→ fetch(`${API_BASE_URL}/api/led/color`, ...)

MQTT消息
    │
    ▼
LED设备订阅并执行
    │
    ▼
返回结果给MCP服务器
    │
    ▼
MCP返回给Claude
```

### 工作流2：前端交互

```
用户在前端选择工具
    │
    ▼
GET /api/mcp/tools → 获取工具列表
    │
    ▼
用户选择 "control_led"
    │
    ▼
GET /api/mcp/tools/control_led → 获取schema
    │
    ▼
前端生成表单并显示
    │
    ▼
用户填写参数 (color=FF0000, brightness=200)
    │
    ▼
用户点击"执行"按钮
    │
    ▼
POST /api/mcp/tools/control_led → 发送参数
    │
    ▼
后端通过RPC调用MCP服务器
    │
    ▼
MCP执行工具 → 发送MQTT/HTTP命令
    │
    ▼
等待设备响应
    │
    ▼
返回结果给前端
    │
    ▼
前端显示成功/失败信息
    │
    ▼
保存到执行历史
```

---

## 💡 前端调用接口示例

### 调用方式1：获取所有工具

```
HTTP请求：
GET /api/mcp/tools

响应示例：
{
  "tools": [
    {
      "name": "control_led",
      "title": "控制LED灯",
      "description": "设置WS2812 RGB LED灯的颜色和亮度",
      "inputSchema": {
        "type": "object",
        "properties": {
          "color": { "type": "string", "pattern": "^#?[0-9A-Fa-f]{6}$" },
          "brightness": { "type": "number", "minimum": 0, "maximum": 255 }
        },
        "required": ["color", "brightness"]
      }
    },
    {
      "name": "send_screen_message",
      "title": "发送消息到屏幕",
      "description": "向OLED屏幕发送文本消息",
      "inputSchema": {
        "type": "object",
        "properties": {
          "content": { "type": "string" }
        },
        "required": ["content"]
      }
    }
  ]
}
```

### 调用方式2：执行指定工具

```
HTTP请求：
POST /api/mcp/tools/control_led
Content-Type: application/json

{
  "arguments": {
    "color": "FF0000",
    "brightness": 200
  }
}

响应示例：
{
  "success": true,
  "content": [{
    "type": "text",
    "text": "✅ LED灯已设置为颜色 #FF0000，亮度 200"
  }],
  "executionTime": 245,  // 毫秒
  "timestamp": "2026-03-12T18:08:00Z"
}
```

### 调用方式3：获取工具详情

```
HTTP请求：
GET /api/mcp/tools/control_led

响应示例：
{
  "name": "control_led",
  "title": "控制LED灯",
  "description": "设置WS2812 RGB LED灯的颜色和亮度",
  "inputSchema": { ... },
  "lastExecuted": "2026-03-12T18:07:30Z",
  "executionCount": 42,
  "lastResult": { ... }
}
```

---

## 📝 环境变量配置

添加到 `.env` 文件：

```
# MQTT配置
MQTT_BROKER=mqtt.example.com
MQTT_PORT=1883
MQTT_USER=your_username
MQTT_PASSWORD=your_password

# MCP服务器配置
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=3000
MCP_RPC_TIMEOUT=5000

# 前端API配置
API_BASE_URL=https://mcp-server.fuufhjn.link
ENABLE_MCP_INTERFACE=true
```

---

## 🎯 优先级建议

### 第一阶段：基础MQTT集成
✅ 必做
- [ ] 添加MQTT客户端到MCP服务器
- [ ] 修改工具函数使用MQTT
- [ ] 测试MQTT通信

### 第二阶段：后端API层
⭐ 推荐
- [ ] 创建MCP接口路由
- [ ] 实现RPC调用MCP服务器
- [ ] 添加执行历史存储

### 第三阶段：前端UI
🎨 可选
- [ ] 创建工具列表组件
- [ ] 创建动态表单组件
- [ ] 实现实时结果显示

---

**版本**: 1.0.0  
**最后更新**: 2026-03-12  
**作者**: Smart Home MCP Team
