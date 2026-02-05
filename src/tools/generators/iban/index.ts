import type { ToolDefinition } from '@/tools/types';

// IBAN country configurations (BBAN length and sample bank codes)
const COUNTRY_CONFIGS: Record<string, { bbanLength: number; bankCodes: string[] }> = {
  DE: { bbanLength: 18, bankCodes: ['37040044', '10010010', '50070010'] }, // Germany
  FR: { bbanLength: 23, bankCodes: ['20041010', '30002005'] }, // France
  GB: { bbanLength: 18, bankCodes: ['NWBK', 'BARC', 'HSBC', 'LOYD'] }, // UK
  ES: { bbanLength: 20, bankCodes: ['2100', '0049', '0182'] }, // Spain
  IT: { bbanLength: 23, bankCodes: ['X0542811101', 'X0503401000'] }, // Italy
  NL: { bbanLength: 14, bankCodes: ['ABNA', 'INGB', 'RABO'] }, // Netherlands
  BE: { bbanLength: 12, bankCodes: ['539', '310', '001'] }, // Belgium
  AT: { bbanLength: 16, bankCodes: ['12000', '20111'] }, // Austria
  CH: { bbanLength: 17, bankCodes: ['00762', '00230'] }, // Switzerland
  PL: { bbanLength: 24, bankCodes: ['11402004', '10901014'] }, // Poland
};

// Convert character to number (A=10, B=11, etc.)
function charToNumber(char: string): string {
  const code = char.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String(code - 55); // A=10, B=11, etc.
  }
  return char;
}

// Calculate IBAN check digits
function calculateCheckDigits(countryCode: string, bban: string): string {
  // Rearrange: BBAN + country code + "00"
  const rearranged = bban + countryCode + '00';

  // Convert letters to numbers
  let numericString = '';
  for (const char of rearranged) {
    numericString += charToNumber(char);
  }

  // Calculate mod 97
  let remainder = 0;
  for (const char of numericString) {
    remainder = (remainder * 10 + parseInt(char, 10)) % 97;
  }

  // Check digits = 98 - remainder
  const checkDigits = 98 - remainder;
  return checkDigits.toString().padStart(2, '0');
}

// Validate IBAN
export function validateIBAN(iban: string): { valid: boolean; message: string } {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Check basic format
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban)) {
    return { valid: false, message: 'Invalid IBAN format' };
  }

  // Check minimum length
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return { valid: false, message: 'Invalid IBAN length' };
  }

  // Rearrange: move first 4 chars to end
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

  // Convert letters to numbers
  let numericString = '';
  for (const char of rearranged) {
    numericString += charToNumber(char);
  }

  // Calculate mod 97
  let remainder = 0;
  for (const char of numericString) {
    remainder = (remainder * 10 + parseInt(char, 10)) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, message: 'Invalid IBAN checksum' };
  }

  return { valid: true, message: 'Valid IBAN' };
}

// Generate IBAN for a country
export function generateIBAN(countryCode: string): string {
  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }

  const bankCode = config.bankCodes[Math.floor(Math.random() * config.bankCodes.length)]!;

  // Generate remaining digits for BBAN
  const remainingLength = config.bbanLength - bankCode.length;
  const randomValues = new Uint8Array(remainingLength);
  crypto.getRandomValues(randomValues);

  let accountNumber = '';
  for (let i = 0; i < remainingLength; i++) {
    accountNumber += (randomValues[i]! % 10).toString();
  }

  const bban = bankCode + accountNumber;
  const checkDigits = calculateCheckDigits(countryCode.toUpperCase(), bban);

  return `${countryCode.toUpperCase()}${checkDigits}${bban}`;
}

// Format IBAN with spaces
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '');
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

// Parse IBAN to components
export function parseIBAN(iban: string): {
  countryCode: string;
  checkDigits: string;
  bban: string;
} | null {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 5) return null;

  return {
    countryCode: clean.slice(0, 2),
    checkDigits: clean.slice(2, 4),
    bban: clean.slice(4),
  };
}

// Get supported countries
export function getSupportedCountries(): Array<{ code: string; name: string }> {
  return [
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'PL', name: 'Poland' },
  ];
}

const tool: ToolDefinition = {
  id: 'iban',
  name: 'IBAN Generator',
  description: 'Generate and validate International Bank Account Numbers',
  category: 'generators',
  keywords: ['iban', 'bank', 'account', 'number', 'validate', 'international'],
  icon: 'Building2',
  component: () => import('./IbanGenerator'),
};

export default tool;
