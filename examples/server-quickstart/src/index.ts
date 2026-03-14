import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';

const API_BASE_URL = process.env.API_BASE_URL || 'https://mcp-server.fuufhjn.link';
// const API_BASE_URL = 'http://127.0.0.1:8787';

const server = new McpServer({ name: 'smart-home', version: '1.0.0' });

// LED 控制工具
const ledSchema = z.object({
  color: z.string()
    .regex(/^#?[0-9A-Fa-f]{6}$/)
    .describe('RGB十六进制颜色值，例如: FF0000'),
  brightness: z.number()
    .min(0)
    .max(255)
    .int()
    .describe('亮度值 (0-255)'),
});

server.registerTool(
  'control_led',
  {
    title: '控制LED灯',
    description: '设置WS2812 RGB LED灯的颜色和亮度',
    inputSchema: ledSchema as any, // <-- 必须加 as any
  },
  async ({ color, brightness }: { color: string; brightness: number }) => {
    const normalizedColor = color.replace(/^#/, '').toUpperCase();
    if (!/^[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      return { content: [{ type: 'text' as const, text: '❌ 颜色格式错误' }] };
    }

    if (brightness < 0 || brightness > 255) {
      return { content: [{ type: 'text' as const, text: '❌ 亮度值必须在0-255之间' }] };
    }

    const response = await fetch(`${API_BASE_URL}/api/led/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: normalizedColor, brightness }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return { content: [{ type: 'text' as const, text: `✅ LED灯已设置为颜色 #${normalizedColor}，亮度 ${brightness}` }] };
  },
);

// 屏幕消息工具
const screenSchema = z.object({
  content: z.string().describe('要显示在屏幕上的文本内容'),
});

server.registerTool(
  'send_screen_message',
  {
    title: '发送消息到屏幕',
    description: '向OLED屏幕设备发送文本消息',
    inputSchema: screenSchema as any, // <-- 加 as any
  },
  async ({ content }: { content: string }) => {
    if (!content) return { content: [{ type: 'text' as const, text: '❌ 消息内容不能为空' }] };

    const response = await fetch(`${API_BASE_URL}/api/screen/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return { content: [{ type: 'text' as const, text: `✅ 消息已成功发送到屏幕: "${content}"` }] };
  },
);

// 启动 MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Smart Home MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error in main():', err);
  process.exit(1);
});