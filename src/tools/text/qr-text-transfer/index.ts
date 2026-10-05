import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'qr-text-transfer',
  name: 'QR Text Transfer',
  description: 'Send text through animated QR codes and receive, copy or save it locally',
  category: 'text',
  keywords: ['qr', 'text', 'transfer', 'camera', 'offline', 'clipboard', '二维码', '传文本', '文字', '扫码'],
  icon: 'ScanLine',
  component: () => import('./QrTextTransfer'),
};

export default tool;
