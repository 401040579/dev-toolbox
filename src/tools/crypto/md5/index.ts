import type { ToolDefinition } from '@/tools/types';

// MD5 implementation (for legacy/checksum purposes only)
function md5(input: string): string {
  const utf8 = new TextEncoder().encode(input);
  return md5Bytes(utf8);
}

function md5Bytes(bytes: Uint8Array): string {
  // MD5 helper functions
  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  function addUnsigned(x: number, y: number): number {
    return (x + y) >>> 0;
  }

  function F(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  // Pre-processing: adding padding bits
  const msgLen = bytes.length;
  const bitLen = msgLen * 8;
  const padLen = ((msgLen + 8) >>> 6 << 6) + 64 - msgLen - 8;
  const paddedMsg = new Uint8Array(msgLen + padLen + 8);
  paddedMsg.set(bytes);
  paddedMsg[msgLen] = 0x80;

  // Append length in bits as 64-bit little-endian
  const view = new DataView(paddedMsg.buffer);
  view.setUint32(paddedMsg.length - 8, bitLen >>> 0, true);
  view.setUint32(paddedMsg.length - 4, Math.floor(bitLen / 0x100000000), true);

  // Initialize hash values
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  // Process each 64-byte block
  for (let i = 0; i < paddedMsg.length; i += 64) {
    const block = new DataView(paddedMsg.buffer, i, 64);
    const x: number[] = new Array(16);
    for (let j = 0; j < 16; j++) {
      x[j] = block.getUint32(j * 4, true);
    }
    // Helper to get x values (TypeScript strict mode)
    const X = (i: number) => x[i] as number;

    const aa = a, bb = b, cc = c, dd = d;

    // Round 1
    a = FF(a, b, c, d, X(0), 7, 0xd76aa478);
    d = FF(d, a, b, c, X(1), 12, 0xe8c7b756);
    c = FF(c, d, a, b, X(2), 17, 0x242070db);
    b = FF(b, c, d, a, X(3), 22, 0xc1bdceee);
    a = FF(a, b, c, d, X(4), 7, 0xf57c0faf);
    d = FF(d, a, b, c, X(5), 12, 0x4787c62a);
    c = FF(c, d, a, b, X(6), 17, 0xa8304613);
    b = FF(b, c, d, a, X(7), 22, 0xfd469501);
    a = FF(a, b, c, d, X(8), 7, 0x698098d8);
    d = FF(d, a, b, c, X(9), 12, 0x8b44f7af);
    c = FF(c, d, a, b, X(10), 17, 0xffff5bb1);
    b = FF(b, c, d, a, X(11), 22, 0x895cd7be);
    a = FF(a, b, c, d, X(12), 7, 0x6b901122);
    d = FF(d, a, b, c, X(13), 12, 0xfd987193);
    c = FF(c, d, a, b, X(14), 17, 0xa679438e);
    b = FF(b, c, d, a, X(15), 22, 0x49b40821);

    // Round 2
    a = GG(a, b, c, d, X(1), 5, 0xf61e2562);
    d = GG(d, a, b, c, X(6), 9, 0xc040b340);
    c = GG(c, d, a, b, X(11), 14, 0x265e5a51);
    b = GG(b, c, d, a, X(0), 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, X(5), 5, 0xd62f105d);
    d = GG(d, a, b, c, X(10), 9, 0x02441453);
    c = GG(c, d, a, b, X(15), 14, 0xd8a1e681);
    b = GG(b, c, d, a, X(4), 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, X(9), 5, 0x21e1cde6);
    d = GG(d, a, b, c, X(14), 9, 0xc33707d6);
    c = GG(c, d, a, b, X(3), 14, 0xf4d50d87);
    b = GG(b, c, d, a, X(8), 20, 0x455a14ed);
    a = GG(a, b, c, d, X(13), 5, 0xa9e3e905);
    d = GG(d, a, b, c, X(2), 9, 0xfcefa3f8);
    c = GG(c, d, a, b, X(7), 14, 0x676f02d9);
    b = GG(b, c, d, a, X(12), 20, 0x8d2a4c8a);

    // Round 3
    a = HH(a, b, c, d, X(5), 4, 0xfffa3942);
    d = HH(d, a, b, c, X(8), 11, 0x8771f681);
    c = HH(c, d, a, b, X(11), 16, 0x6d9d6122);
    b = HH(b, c, d, a, X(14), 23, 0xfde5380c);
    a = HH(a, b, c, d, X(1), 4, 0xa4beea44);
    d = HH(d, a, b, c, X(4), 11, 0x4bdecfa9);
    c = HH(c, d, a, b, X(7), 16, 0xf6bb4b60);
    b = HH(b, c, d, a, X(10), 23, 0xbebfbc70);
    a = HH(a, b, c, d, X(13), 4, 0x289b7ec6);
    d = HH(d, a, b, c, X(0), 11, 0xeaa127fa);
    c = HH(c, d, a, b, X(3), 16, 0xd4ef3085);
    b = HH(b, c, d, a, X(6), 23, 0x04881d05);
    a = HH(a, b, c, d, X(9), 4, 0xd9d4d039);
    d = HH(d, a, b, c, X(12), 11, 0xe6db99e5);
    c = HH(c, d, a, b, X(15), 16, 0x1fa27cf8);
    b = HH(b, c, d, a, X(2), 23, 0xc4ac5665);

    // Round 4
    a = II(a, b, c, d, X(0), 6, 0xf4292244);
    d = II(d, a, b, c, X(7), 10, 0x432aff97);
    c = II(c, d, a, b, X(14), 15, 0xab9423a7);
    b = II(b, c, d, a, X(5), 21, 0xfc93a039);
    a = II(a, b, c, d, X(12), 6, 0x655b59c3);
    d = II(d, a, b, c, X(3), 10, 0x8f0ccc92);
    c = II(c, d, a, b, X(10), 15, 0xffeff47d);
    b = II(b, c, d, a, X(1), 21, 0x85845dd1);
    a = II(a, b, c, d, X(8), 6, 0x6fa87e4f);
    d = II(d, a, b, c, X(15), 10, 0xfe2ce6e0);
    c = II(c, d, a, b, X(6), 15, 0xa3014314);
    b = II(b, c, d, a, X(13), 21, 0x4e0811a1);
    a = II(a, b, c, d, X(4), 6, 0xf7537e82);
    d = II(d, a, b, c, X(11), 10, 0xbd3af235);
    c = II(c, d, a, b, X(2), 15, 0x2ad7d2bb);
    b = II(b, c, d, a, X(9), 21, 0xeb86d391);

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  // Convert to hex string (little-endian)
  const hex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return s;
  };

  return hex(a) + hex(b) + hex(c) + hex(d);
}

export { md5, md5Bytes };

const tool: ToolDefinition = {
  id: 'md5',
  name: 'MD5 Hash',
  description: 'Generate MD5 hash (for checksums only, not secure)',
  category: 'crypto',
  keywords: ['md5', 'hash', 'checksum', 'digest'],
  icon: 'Hash',
  component: () => import('./Md5'),
  transforms: [
    {
      id: 'md5',
      name: 'MD5 Hash',
      description: 'Generate MD5 hash of text',
      inputType: 'string',
      outputType: 'string',
      transform: md5,
    },
  ],
};

export default tool;
