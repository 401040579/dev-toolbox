import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'qrcode-generator',
  name: 'QR Code Generator',
  description: 'Generate QR codes from text or URLs',
  category: 'generators',
  keywords: ['qr', 'qrcode', 'barcode', 'generate', 'scan'],
  icon: 'QrCode',
  component: () => import('./QrCodeGenerator'),
};

export default tool;
