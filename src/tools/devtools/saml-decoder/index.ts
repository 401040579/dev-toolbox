import type { ToolDefinition } from '@/tools/types';

export interface SamlInfo {
  xml: string;
  issuer?: string;
  nameId?: string;
  sessionIndex?: string;
  attributes: { name: string; value: string }[];
  conditions?: { notBefore?: string; notOnOrAfter?: string };
}

export function decodeSaml(input: string): SamlInfo | null {
  let xml = input.trim();

  // Try URL decoding first
  try {
    const decoded = decodeURIComponent(xml);
    if (decoded !== xml) xml = decoded;
  } catch {
    // not URL encoded
  }

  // Try Base64 decoding
  if (!xml.startsWith('<')) {
    try {
      xml = atob(xml);
    } catch {
      return null;
    }
  }

  // Try to inflate (deflated SAML)
  if (!xml.startsWith('<')) {
    return null;
  }

  const info: SamlInfo = { xml, attributes: [] };

  // Extract Issuer
  const issuerMatch = xml.match(/<(?:saml2?:)?Issuer[^>]*>(.*?)<\/(?:saml2?:)?Issuer>/s);
  if (issuerMatch) info.issuer = issuerMatch[1]!.trim();

  // Extract NameID
  const nameIdMatch = xml.match(/<(?:saml2?:)?NameID[^>]*>(.*?)<\/(?:saml2?:)?NameID>/s);
  if (nameIdMatch) info.nameId = nameIdMatch[1]!.trim();

  // Extract SessionIndex
  const sessionMatch = xml.match(/SessionIndex="([^"]*)"/);
  if (sessionMatch) info.sessionIndex = sessionMatch[1];

  // Extract Attributes
  const attrRegex = /<(?:saml2?:)?Attribute\s+Name="([^"]*)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([\s\S]*?)<\/(?:saml2?:)?AttributeValue>/g;
  let match;
  while ((match = attrRegex.exec(xml)) !== null) {
    info.attributes.push({ name: match[1]!, value: match[2]!.trim() });
  }

  // Extract Conditions
  const condMatch = xml.match(/<(?:saml2?:)?Conditions\s+NotBefore="([^"]*)"(?:\s+NotOnOrAfter="([^"]*)")?/);
  if (condMatch) {
    info.conditions = { notBefore: condMatch[1], notOnOrAfter: condMatch[2] };
  }

  return info;
}

const tool: ToolDefinition = {
  id: 'saml-decoder',
  name: 'SAML Decoder',
  description: 'Decode and inspect SAML assertions and responses',
  category: 'devtools',
  keywords: ['saml', 'decode', 'assertion', 'sso', 'auth', 'xml'],
  icon: 'FileCode',
  component: () => import('./SamlDecoder'),
};

export default tool;
