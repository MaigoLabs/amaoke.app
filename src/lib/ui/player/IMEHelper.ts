import { toHiragana } from "wanakana";
import type { LyricLine, LyricSegment } from "$lib/types";

export type ProcLrcSeg = { swi: number, kanji?: string, kana: string }
export type ProcLrcLine = { parts: ProcLrcSeg[], totalLen: number }
export function processLrcLine(line: LyricSegment[]): ProcLrcLine {
  let result: any[] = line.map(part => (typeof part === "string" ? { kana: part } :
    toHiragana(part[0]) === toHiragana(part[1]) ? { kana: part[0] } : { kanji: part[0], kana: part[1] }))
  let swi = 0
  for (let item of result) {
    item['swi'] = swi
    swi += item.kana.length
  }
  return { parts: result, totalLen: swi }
}

// Fuzzy matching rules
const fuzzyMatch = [['わ', 'は'], ['を', 'お'], ['ず', 'づ'], ['が', 'は'],
  ['ぁ', 'あ'], ['ぃ', 'い'], ['ぅ', 'う'], ['ぇ', 'え'], ['ぉ', 'お'],
  ['ゃ', 'や'], ['ゅ', 'ゆ'], ['ょ', 'よ'], ['っ', 'つ']]
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

/**
 * Remove duplicate lyric lines based on their content.
 */
export function dedupLines(lrc: LyricLine[], hide: boolean) {
  if (!hide) return lrc;
  const seen = new Set<string>();
  return lrc.filter(line => {
    const key = JSON.stringify(line.lyric);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}