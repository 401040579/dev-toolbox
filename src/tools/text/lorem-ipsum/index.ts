import type { ToolDefinition } from '@/tools/types';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi',
  'nesciunt', 'neque', 'porro', 'quisquam', 'nihil', 'impedit', 'quo', 'minus',
];

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]!;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateSentence(minWords = 5, maxWords = 15): string {
  const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    words.push(randomWord());
  }

  return capitalize(words.join(' ')) + '.';
}

export function generateParagraph(minSentences = 3, maxSentences = 7): string {
  const sentenceCount = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences: string[] = [];

  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }

  return sentences.join(' ');
}

export function generateLoremIpsum(
  count: number,
  type: 'paragraphs' | 'sentences' | 'words',
  startWithLorem = true
): string {
  let result: string;

  if (type === 'words') {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(randomWord());
    }
    result = words.join(' ');
  } else if (type === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      sentences.push(generateSentence());
    }
    result = sentences.join(' ');
  } else {
    const paragraphs: string[] = [];
    for (let i = 0; i < count; i++) {
      paragraphs.push(generateParagraph());
    }
    result = paragraphs.join('\n\n');
  }

  if (startWithLorem && result.length > 0) {
    result = 'Lorem ipsum dolor sit amet' + result.slice(result.indexOf(' '));
  }

  return result;
}

const tool: ToolDefinition = {
  id: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  description: 'Generate placeholder text for designs and mockups',
  category: 'text',
  keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'generate'],
  icon: 'FileText',
  component: () => import('./LoremIpsum'),
};

export default tool;
