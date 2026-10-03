import type { ToolDefinition } from '@/tools/types';
const tool: ToolDefinition = {
  id: 'qr-file-transfer',
  name: 'QR File Transfer',
  description: 'Send files through animated QR codes and receive them with a camera, entirely locally',
  category: 'image',
  keywords: ['qr', 'file', 'transfer', 'camera', 'offline', 'animated', 'raptorq', '二维码', '传文件', '扫码'],
  icon: 'ScanLine',
  component: () => import('./QrFileTransfer'),
};
export default tool;
