import type { ToolDefinition } from '@/tools/types';

// Data pools for generation
const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'example.com', 'company.com', 'business.org', 'mail.io'];

const STREET_NAMES = ['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Park', 'Lake', 'Hill', 'River', 'Spring', 'Valley', 'Forest', 'Sunset', 'Highland'];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Rd', 'Dr', 'Ln', 'Way', 'Ct', 'Pl'];

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Indianapolis', 'Charlotte', 'San Francisco', 'Seattle', 'Denver', 'Boston'];

const STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

const COMPANIES = ['Acme', 'Tech', 'Global', 'Prime', 'Stellar', 'Summit', 'Horizon', 'Nova', 'Atlas', 'Vertex'];

const COMPANY_SUFFIXES = ['Inc', 'Corp', 'LLC', 'Co', 'Group', 'Industries', 'Solutions', 'Systems', 'Technologies', 'Enterprises'];

export type FakeDataType = 'name' | 'email' | 'phone' | 'address' | 'company' | 'creditCard' | 'date' | 'username' | 'password' | 'url' | 'ipv4' | 'all';

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateFirstName(): string {
  return randomItem(FIRST_NAMES);
}

export function generateLastName(): string {
  return randomItem(LAST_NAMES);
}

export function generateFullName(): string {
  return `${generateFirstName()} ${generateLastName()}`;
}

export function generateEmail(firstName?: string, lastName?: string): string {
  const first = (firstName || generateFirstName()).toLowerCase();
  const last = (lastName || generateLastName()).toLowerCase();
  const domain = randomItem(DOMAINS);
  const separator = randomItem(['.', '_', '']);
  const number = Math.random() > 0.5 ? randomInt(1, 99) : '';
  return `${first}${separator}${last}${number}@${domain}`;
}

export function generatePhone(): string {
  const area = randomInt(200, 999);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return `(${area}) ${exchange}-${number}`;
}

export function generateAddress(): string {
  const number = randomInt(100, 9999);
  const street = randomItem(STREET_NAMES);
  const type = randomItem(STREET_TYPES);
  const city = randomItem(CITIES);
  const state = randomItem(STATES);
  const zip = randomInt(10000, 99999);
  return `${number} ${street} ${type}, ${city}, ${state} ${zip}`;
}

export function generateCompany(): string {
  const name = randomItem(COMPANIES);
  const suffix = randomItem(COMPANY_SUFFIXES);
  return `${name} ${suffix}`;
}

export function generateCreditCard(): string {
  // Generate a fake Visa-like number (passes Luhn check)
  const prefix = '4';
  let number = prefix;
  for (let i = 1; i < 15; i++) {
    number += randomInt(0, 9);
  }
  // Calculate Luhn check digit
  number += calculateLuhnCheckDigit(number);
  return number.replace(/(\d{4})/g, '$1 ').trim();
}

function calculateLuhnCheckDigit(number: string): number {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let digit = parseInt(number[number.length - 1 - i]!, 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function generateDate(startYear = 1970, endYear = 2024): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function generateUsername(): string {
  const adjectives = ['cool', 'super', 'mega', 'ultra', 'pro', 'epic', 'ninja', 'cyber', 'tech', 'dark'];
  const nouns = ['wolf', 'tiger', 'eagle', 'dragon', 'phoenix', 'knight', 'wizard', 'coder', 'hacker', 'gamer'];
  const adj = randomItem(adjectives);
  const noun = randomItem(nouns);
  const number = randomInt(1, 999);
  return `${adj}_${noun}${number}`;
}

export function generatePassword(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i]! % chars.length];
  }
  return password;
}

export function generateUrl(): string {
  const protocols = ['https'];
  const tlds = ['com', 'org', 'net', 'io', 'co'];
  const words = ['app', 'site', 'web', 'page', 'portal', 'hub', 'cloud', 'data', 'api', 'dev'];
  const protocol = randomItem(protocols);
  const subdomain = Math.random() > 0.5 ? 'www.' : '';
  const name = randomItem(words) + randomItem(words);
  const tld = randomItem(tlds);
  return `${protocol}://${subdomain}${name}.${tld}`;
}

export function generateIPv4(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

export interface FakeRecord {
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  creditCard: string;
  date: string;
  username: string;
  password: string;
  url: string;
  ipv4: string;
}

export function generateFakeRecord(): FakeRecord {
  const firstName = generateFirstName();
  const lastName = generateLastName();
  return {
    name: `${firstName} ${lastName}`,
    email: generateEmail(firstName, lastName),
    phone: generatePhone(),
    address: generateAddress(),
    company: generateCompany(),
    creditCard: generateCreditCard(),
    date: generateDate(),
    username: generateUsername(),
    password: generatePassword(),
    url: generateUrl(),
    ipv4: generateIPv4(),
  };
}

const tool: ToolDefinition = {
  id: 'fake-data',
  name: 'Fake Data Generator',
  description: 'Generate realistic fake data for testing and development',
  category: 'generators',
  keywords: ['fake', 'mock', 'test', 'data', 'random', 'name', 'email', 'address', 'phone'],
  icon: 'Users',
  component: () => import('./FakeDataGenerator'),
};

export default tool;
