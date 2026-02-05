import type { ToolDefinition } from '@/tools/types';

const NATO_ALPHABET: Record<string, string> = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta',
  'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
  'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
  'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
  'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
  'Y': 'Yankee', 'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
  '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
  '8': 'Eight', '9': 'Niner',
};

const REVERSE_NATO: Record<string, string> = Object.fromEntries(
  Object.entries(NATO_ALPHABET).map(([k, v]) => [v.toLowerCase(), k])
);

export function toNatoPhonetic(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map((char) => NATO_ALPHABET[char] || char)
    .join(' ');
}

export function fromNatoPhonetic(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => REVERSE_NATO[word] || word)
    .join('');
}

export function getNatoAlphabet(): Array<{ letter: string; word: string }> {
  return Object.entries(NATO_ALPHABET).map(([letter, word]) => ({ letter, word }));
}

const tool: ToolDefinition = {
  id: 'nato-phonetic',
  name: 'NATO Phonetic Alphabet',
  description: 'Convert text to NATO phonetic alphabet',
  category: 'text',
  keywords: ['nato', 'phonetic', 'alphabet', 'spelling', 'aviation', 'military'],
  icon: 'Radio',
  component: () => import('./NatoPhonetic'),
  transforms: [
    {
      id: 'to-nato',
      name: 'To NATO',
      description: 'Convert text to NATO phonetic',
      inputType: 'string',
      outputType: 'string',
      transform: toNatoPhonetic,
    },
  ],
};

export default tool;
