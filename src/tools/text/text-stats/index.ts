import type { ToolDefinition } from '@/tools/types';

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  readingTime: number; // minutes
  speakingTime: number; // minutes
  uniqueWords: number;
  avgWordLength: number;
  avgSentenceLength: number;
  longestWord: string;
}

export function analyzeText(text: string): TextStats {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      bytes: new TextEncoder().encode('').length,
      readingTime: 0,
      speakingTime: 0,
      uniqueWords: 0,
      avgWordLength: 0,
      avgSentenceLength: 0,
      longestWord: '',
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim()).length;
  const lines = text.split('\n').length;
  const bytes = new TextEncoder().encode(text).length;

  // Reading time: ~200-250 words per minute
  const readingTime = Math.ceil(wordCount / 200);
  // Speaking time: ~125-150 words per minute
  const speakingTime = Math.ceil(wordCount / 130);

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''))).size;
  const avgWordLength = wordCount > 0
    ? Math.round((words.reduce((sum, w) => sum + w.length, 0) / wordCount) * 10) / 10
    : 0;
  const avgSentenceLength = sentences > 0 ? Math.round((wordCount / sentences) * 10) / 10 : 0;
  const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');

  return {
    characters,
    charactersNoSpaces,
    words: wordCount,
    sentences,
    paragraphs,
    lines,
    bytes,
    readingTime,
    speakingTime,
    uniqueWords,
    avgWordLength,
    avgSentenceLength,
    longestWord,
  };
}

const tool: ToolDefinition = {
  id: 'text-stats',
  name: 'Text Statistics',
  description: 'Count characters, words, sentences, and analyze text',
  category: 'text',
  keywords: ['text', 'statistics', 'count', 'words', 'characters', 'sentences', 'reading', 'time'],
  icon: 'BarChart2',
  component: () => import('./TextStats'),
};

export default tool;
