import { describe, expect, it } from 'vitest';
import { decimalToIPv4, parseIPv4, parseIPv6 } from './index';

describe('IPv4 input and numeric representations', () => {
  it('converts all four octets without losing unsigned bits', () => {
    expect(parseIPv4('192.168.1.1')).toEqual({
      decimal: '3232235777',
      binary: '11000000.10101000.00000001.00000001',
      hex: 'C0.A8.01.01',
      octal: '300.250.1.1',
      class: 'C',
      type: 'Private',
      isPrivate: true,
      isLoopback: false,
      isMulticast: false,
    });
    expect(parseIPv4('255.255.255.255')?.decimal).toBe('4294967295');
    expect(parseIPv4('0.0.0.0')?.decimal).toBe('0');
  });

  it('keeps digit-only leading zeros as decimal octets', () => {
    expect(parseIPv4('010.000.001.009')).toEqual(parseIPv4('10.0.1.9'));
  });

  it.each([
    '', '192x.168.1.1', '192.168.1.1oops', '192.168.1.1\n',
    '192.168.1.1 ', ' 192.168.1.1', '192. 168.1.1',
    '+192.168.1.1', '-0.168.1.1', '0xc0.168.1.1', '1e2.168.1.1',
    '192.168.1', '192.168.1.1.2', '192..1.1', '.192.168.1',
    '192.168.1.', '256.168.1.1', '0000.168.1.1', '１２７.0.0.1',
  ])('rejects malformed IPv4 input %j instead of truncating it', (input) => {
    expect(parseIPv4(input)).toBeNull();
  });

  it.each([
    ['172.15.255.255', 'Public', false, false, false],
    ['172.16.0.0', 'Private', true, false, false],
    ['172.31.255.255', 'Private', true, false, false],
    ['172.32.0.0', 'Public', false, false, false],
    ['127.0.0.1', 'Loopback', false, true, false],
    ['224.0.0.1', 'Multicast', false, false, true],
    ['239.255.255.255', 'Multicast', false, false, true],
    ['240.0.0.1', 'Public', false, false, false],
  ] as const)('preserves the existing IPv4 type contract for %s', (input, type, isPrivate, isLoopback, isMulticast) => {
    expect(parseIPv4(input)).toMatchObject({ type, isPrivate, isLoopback, isMulticast });
  });
});

describe('decimal IPv4 input', () => {
  it.each([
    ['0', '0.0.0.0'],
    ['1', '0.0.0.1'],
    ['2147483648', '128.0.0.0'],
    ['3232235777', '192.168.1.1'],
    ['4294967295', '255.255.255.255'],
    ['00000001', '0.0.0.1'],
  ])('converts the complete unsigned decimal %s', (input, expected) => {
    expect(decimalToIPv4(input)).toBe(expected);
    expect(parseIPv4(expected)?.decimal).toBe(Number(input).toString());
  });

  it.each([
    '', ' ', '3232235777oops', '1.5', '1e3', '0xffffffff',
    '+1', '-1', '-0', ' 1', '1 ', '1\n', '１',
    '4294967296', '9007199254740993', 'NaN', 'Infinity', '9'.repeat(400),
  ])('rejects incomplete or out-of-range decimal input %j', (input) => {
    expect(decimalToIPv4(input)).toBeNull();
  });
});

describe('IPv6 validation and compression', () => {
  it.each([
    ['::', '::'],
    ['0:0:0:0:0:0:0:1', '::1'],
    ['2001:0db8:00A0:000b:0:0:0:0001', '2001:db8:a0:b::1'],
    ['2001:0:0:1:0:0:0:1', '2001:0:0:1::1'],
    ['2001:db8:0:0:1:0:0:1', '2001:db8::1:0:0:1'],
    ['0:0:0:1:0:0:0:1', '::1:0:0:0:1'],
    ['0:0:1:2:3:4:5:6', '::1:2:3:4:5:6'],
    ['1:2:3:4:5:6:0:0', '1:2:3:4:5:6::'],
    ['2001:db8::', '2001:db8::'],
    ['2001:db8::0:1', '2001:db8::1'],
    ['2001:db8::1:2:3:4:5', '2001:db8:0:1:2:3:4:5'],
    ['::1:2:3:4:5:6:7', '0:1:2:3:4:5:6:7'],
    ['1:2:3:4:5:6:7::', '1:2:3:4:5:6:7:0'],
    ['0001:0002:0003:0004:0005:0006:0007:0008', '1:2:3:4:5:6:7:8'],
    ['FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
  ])('normalizes %s without changing the address', (input, compressed) => {
    const result = parseIPv6(input);
    expect(result).not.toBeNull();
    expect(result?.compressed).toBe(compressed);
    expect(parseIPv6(compressed)?.full).toBe(result?.full);
  });

  it('retains the padded uppercase full form and exact 128 binary bits', () => {
    const result = parseIPv6('2001:db8:a0:b::1');
    expect(result?.full).toBe('2001:0DB8:00A0:000B:0000:0000:0000:0001');
    expect(result?.binary).toBe([
      '0010000000000001', '0000110110111000', '0000000010100000', '0000000000001011',
      '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000001',
    ].join(':'));
  });

  it.each([
    '', ':', ':::', '1:::2', '1::2::3', '::1::',
    ':1:2:3:4:5:6:7', '1:2:3:4:5:6:7:',
    '1:2:3:4:5:6:7', '1:2:3:4:5:6:7:8:9',
    '1:2:3:4:5:6:7:8::', '1:2:3:4:5:6:7::8',
    '12345::1', 'gggg::1', '1g:2:3:4:5:6:7:8', '-1:2:3:4:5:6:7:8',
    '+1::1', '0x1::1', '2001:db8::1\n', '2001:db8::1 ', ' 2001:db8::1',
    '::ffff:192.0.2.1', 'fe80::1%eth0', '2001:db8::1/64', '[2001:db8::1]',
  ])('rejects malformed or unsupported IPv6 input %j', (input) => {
    expect(parseIPv6(input)).toBeNull();
  });
});

describe('IPv6 address types', () => {
  it.each([
    ['::', 'Unspecified', false, false],
    ['0:0:0:0:0:0:0:0', 'Unspecified', false, false],
    ['::1', 'Loopback', true, false],
    ['::2', 'Global Unicast', false, false],
    ['fe7f::1', 'Global Unicast', false, false],
    ['fe80::1', 'Link-Local', false, true],
    ['fe90::1', 'Link-Local', false, true],
    ['fea0::1', 'Link-Local', false, true],
    ['febf:ffff::1', 'Link-Local', false, true],
    ['fec0::1', 'Global Unicast', false, false],
    ['fbff::1', 'Global Unicast', false, false],
    ['fc00::1', 'Unique Local', false, false],
    ['fdff::1', 'Unique Local', false, false],
    ['fe00::1', 'Global Unicast', false, false],
    ['ff00::1', 'Multicast', false, false],
    ['ffff::1', 'Multicast', false, false],
  ] as const)('classifies %s with stable type labels and flags', (input, type, isLoopback, isLinkLocal) => {
    expect(parseIPv6(input)).toMatchObject({ type, isLoopback, isLinkLocal });
  });
});
