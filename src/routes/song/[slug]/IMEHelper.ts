import { toHiragana } from "wanakana";

// Fuzzy matching rules
const fuzzyMatch = [['わ', 'は'], ['を', 'お']]
export function fuzzyEquals(kana1: string, kana2: string): string {
  [kana1, kana2] = [toHiragana(kana1), toHiragana(kana2)]
  if (kana1 === kana2) return 'right'
  if (fuzzyMatch.some(([a, b]) => (kana1 === a && kana2 === b) || (kana1 === b && kana2 === a))) return 'fuzzy'
  return 'wrong'
}

// List of characters need to be composed instead of directly typed
export const composeList = [
  'っ', 'ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ',
  'が', 'ぎ', 'ぐ', 'げ', 'ご',
  'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
  'だ', 'ぢ', 'づ', 'で', 'ど',
  'ば', 'び', 'ぶ', 'べ', 'ぼ',
  'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'
]