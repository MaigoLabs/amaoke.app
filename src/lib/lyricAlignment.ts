import { isKana, toHiragana, toKana } from 'wanakana'
import type { LyricSegment } from './types'

export interface LyricAlignmentToken {
  /** Surface text from the lyric line. Pass tokenizer-sized chunks for better boundaries. */
  surface: string
  /** Optional dictionary/tokenizer reading candidates. Romaji, hiragana, and katakana are accepted. */
  reading?: string | string[]
  /** Override whether this token should become a furigana segment. */
  annotate?: boolean
}

export interface AlignedLyricToken {
  surface: string
  reading: string
  expectedReadings: string[]
  range: [start: number, end: number]
  confidence: number
  cost: number
  annotate: boolean
  matchedExpected: boolean
}

export interface LyricAlignmentResult {
  normalizedPronunciation: string
  segments: LyricSegment[]
  tokens: AlignedLyricToken[]
  confidence: number
  cost: number
  warnings: string[]
}

export interface LyricAlignmentOptions {
  tokens?: LyricAlignmentToken[]
  /** Kana/katakana lyric anchors should normally consume their exact reading. */
  maxAnchorReadingDelta?: number
  /** Dictionary readings for kanji may legitimately differ in songs. */
  maxKnownReadingDelta?: number
  /** Upper bound for tokens without a usable reading candidate. */
  maxUnknownReadingLengthPerChar?: number
}

type UnitKind = 'anchor' | 'known' | 'unknown' | 'silent'

interface PreparedToken {
  surface: string
  expectedReadings: string[]
  annotate: boolean
  kind: UnitKind
  maxReadingLength: number
  minReadingLength: number
}

interface Choice {
  prevJ: number
  consumed: string
  expectedDistance: number
  tokenCost: number
}

const defaultOptions = {
  maxAnchorReadingDelta: 1,
  maxKnownReadingDelta: 4,
  maxUnknownReadingLengthPerChar: 8,
}

const readingCharRegex = /^[ぁ-ゖー]$/u
const latinRegex = /[a-z0-9]/iu
const whitespaceRegex = /^\s$/u
const kanjiRegex = /\p{Script=Han}|々|〆/u

/**
 * Converts a NetEase-style pronunciation line into compact hiragana.
 *
 * Examples:
 * - `ka ta chi mo` -> `かたちも`
 * - `「na ni mo」` -> `なにも`
 * - `ソリッド` -> `そりっど`
 */
export function normalizePronunciationReading(input: string): string {
  const kana = toHiragana(toKana(input.normalize('NFKC').toLowerCase()))
  return Array.from(kana).filter(char => readingCharRegex.test(char)).join('')
}

/**
 * Fallback tokenizer that splits lyrics into deterministic display units by script.
 * For better word boundaries, pass tokens from a Japanese tokenizer to alignLyricPronunciation().
 */
export function tokenizeLyricByScript(lyric: string): LyricAlignmentToken[] {
  const tokens: LyricAlignmentToken[] = []
  let current = ''
  let currentKind = ''

  for (const char of Array.from(lyric)) {
    const kind = surfaceCharKind(char)
    if (current && kind !== currentKind) {
      tokens.push({ surface: current })
      current = ''
    }
    current += char
    currentKind = kind
  }

  if (current) tokens.push({ surface: current })
  return tokens
}

/**
 * Aligns a full-line pronunciation to lyric display segments without using an LLM.
 *
 * The built-in script tokenizer is enough for many lines, but adjacent kanji need
 * tokenizer/dictionary help for good boundaries:
 *
 * ```ts
 * alignLyricPronunciation('全部違う', 'ze n bu chi ga u', {
 *   tokens: [
 *     { surface: '全部', reading: 'ぜんぶ' },
 *     { surface: '違', reading: 'ちが' },
 *     { surface: 'う' },
 *   ],
 * })
 * ```
 */
export function alignLyricPronunciation(
  lyric: string,
  pronunciation: string,
  options: LyricAlignmentOptions = {},
): LyricAlignmentResult {
  const opts = { ...defaultOptions, ...options }
  const sourceTokens = options.tokens?.length ? options.tokens : tokenizeLyricByScript(lyric)
  const tokens = sourceTokens.map(token => prepareToken(token, opts))
  const normalizedPronunciation = normalizePronunciationReading(pronunciation)
  const warnings: string[] = []

  if (!normalizedPronunciation) {
    warnings.push('No usable pronunciation characters found; falling back to token readings where available.')
    return fallbackFromExpectedReadings(tokens, normalizedPronunciation, warnings)
  }

  const alignment = alignPreparedTokens(tokens, normalizedPronunciation)
  if (!alignment) {
    warnings.push('Unable to align the full pronunciation line; falling back to token readings where available.')
    return fallbackFromExpectedReadings(tokens, normalizedPronunciation, warnings)
  }

  const alignedTokens = tokens.map((token, index): AlignedLyricToken => {
    const choice = alignment.choices[index]
    const expectedDistance = choice.expectedDistance
    return {
      surface: token.surface,
      reading: choice.consumed,
      expectedReadings: token.expectedReadings,
      range: [choice.prevJ, choice.prevJ + choice.consumed.length],
      confidence: tokenConfidence(token, choice.consumed, expectedDistance),
      cost: choice.tokenCost,
      annotate: token.annotate,
      matchedExpected: expectedDistance === 0,
    }
  })

  const confidence = averageConfidence(alignedTokens)
  if (confidence < 0.7) warnings.push('Low-confidence pronunciation alignment; consider LLM or manual review for this line.')

  return {
    normalizedPronunciation,
    segments: tokensToSegments(alignedTokens),
    tokens: alignedTokens,
    confidence,
    cost: alignment.cost,
    warnings,
  }
}

function prepareToken(token: LyricAlignmentToken, opts: typeof defaultOptions): PreparedToken {
  const readings = normalizeTokenReadings(token.reading)
  const surfaceReadings = surfaceKanaReadings(token.surface) ?? []
  for (const surfaceReading of surfaceReadings) {
    if (surfaceReading && !readings.includes(surfaceReading)) readings.push(surfaceReading)
  }

  const hasKanji = containsKanji(token.surface)
  const hasLatin = latinRegex.test(token.surface)
  const annotate = token.annotate ?? (hasKanji || hasLatin)
  const kind = getTokenKind(token.surface, readings)
  const surfaceLength = Math.max(1, Array.from(token.surface).filter(char => !isSilentSurfaceChar(char)).length)
  const knownMax = Math.max(0, ...readings.map(reading => reading.length))
  const knownMin = Math.min(...readings.map(reading => reading.length))
  const maxReadingLength = kind === 'unknown'
    ? surfaceLength * opts.maxUnknownReadingLengthPerChar
    : kind === 'anchor'
      ? knownMax + opts.maxAnchorReadingDelta
      : knownMax + opts.maxKnownReadingDelta
  const minReadingLength = kind === 'silent'
    ? 0
    : kind === 'unknown'
      ? 1
      : Math.max(1, knownMin - (kind === 'anchor' ? opts.maxAnchorReadingDelta : opts.maxKnownReadingDelta))

  return {
    surface: token.surface,
    expectedReadings: readings,
    annotate,
    kind,
    maxReadingLength,
    minReadingLength,
  }
}

function normalizeTokenReadings(reading: LyricAlignmentToken['reading']): string[] {
  const readings = Array.isArray(reading) ? reading : reading ? [reading] : []
  return Array.from(new Set(readings.map(normalizePronunciationReading).filter(Boolean)))
}

function getTokenKind(surface: string, readings: string[]): UnitKind {
  if (isSilentSurface(surface)) return 'silent'
  if (!readings.length) return 'unknown'
  if (surfaceKanaReadings(surface)) return 'anchor'
  return 'known'
}

function surfaceKanaReadings(surface: string): string[] | undefined {
  if (isSilentSurface(surface)) return []
  const chars = Array.from(surface)
  if (chars.every(char => isKana(char) || char === 'ー')) return kanaReadingVariants(chars)
  return undefined
}

function kanaReadingVariants(chars: string[]): string[] {
  let variants = ['']
  for (const char of chars) {
    const normalized = normalizePronunciationReading(char)
    const readings = [normalized]
    if (char === 'は') readings.push('わ')
    else if (char === 'へ') readings.push('え')
    else if (char === 'を') readings.push('お')

    variants = variants.flatMap(prefix => readings.map(reading => prefix + reading))
    if (variants.length > 32) variants = variants.slice(0, 32)
  }
  return Array.from(new Set(variants.filter(Boolean)))
}

function alignPreparedTokens(tokens: PreparedToken[], reading: string): { choices: Choice[], cost: number } | null {
  const n = tokens.length
  const m = reading.length
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(Infinity))
  const choices = Array.from({ length: n + 1 }, () => Array<Choice | null>(m + 1).fill(null))
  const suffixMin = minRemainingLengths(tokens)

  dp[0][0] = 0

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= m; j++) {
      if (!Number.isFinite(dp[i][j])) continue
      for (const choice of transitions(tokens[i], reading, j, suffixMin[i + 1])) {
        const nextJ = j + choice.consumed.length
        const nextCost = dp[i][j] + choice.tokenCost
        if (nextCost < dp[i + 1][nextJ]) {
          dp[i + 1][nextJ] = nextCost
          choices[i + 1][nextJ] = choice
        }
      }
    }
  }

  if (!Number.isFinite(dp[n][m])) return null

  const result: Choice[] = []
  let j = m
  for (let i = n; i > 0; i--) {
    const choice = choices[i][j]
    if (!choice) return null
    result.unshift(choice)
    j = choice.prevJ
  }

  return { choices: result, cost: dp[n][m] }
}

function transitions(token: PreparedToken, reading: string, start: number, remainingMin: number): Choice[] {
  if (token.kind === 'silent') return [{ prevJ: start, consumed: '', expectedDistance: 0, tokenCost: 0 }]

  const remaining = reading.length - start
  const maxLength = Math.min(token.maxReadingLength, remaining - remainingMin)
  if (maxLength < 1) return []

  const result: Choice[] = []
  for (let length = token.minReadingLength; length <= maxLength; length++) {
    const consumed = reading.slice(start, start + length)
    const expectedDistance = expectedReadingDistance(token, consumed)
    result.push({
      prevJ: start,
      consumed,
      expectedDistance,
      tokenCost: tokenCost(token, consumed, expectedDistance),
    })
  }
  return result
}

function expectedReadingDistance(token: PreparedToken, consumed: string): number {
  if (!token.expectedReadings.length) return 0
  return Math.min(...token.expectedReadings.map(expected => editDistance(expected, consumed)))
}

function tokenCost(token: PreparedToken, consumed: string, expectedDistance: number): number {
  if (token.kind === 'unknown') return 0.25 + consumed.length * 0.01
  if (token.kind === 'anchor') return expectedDistance * 5 + Math.abs(consumed.length - token.expectedReadings[0].length) * 0.1
  return expectedDistance + Math.abs(consumed.length - token.expectedReadings[0].length) * 0.05
}

function minRemainingLengths(tokens: PreparedToken[]): number[] {
  const min = Array<number>(tokens.length + 1).fill(0)
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i]
    min[i] = min[i + 1] + token.minReadingLength
  }
  return min
}

function fallbackFromExpectedReadings(
  tokens: PreparedToken[],
  normalizedPronunciation: string,
  warnings: string[],
): LyricAlignmentResult {
  const alignedTokens = tokens.map((token): AlignedLyricToken => ({
    surface: token.surface,
    reading: token.expectedReadings[0] ?? '',
    expectedReadings: token.expectedReadings,
    range: [0, 0],
    confidence: token.expectedReadings.length ? 0.5 : 0,
    cost: 0,
    annotate: token.annotate,
    matchedExpected: Boolean(token.expectedReadings.length),
  }))

  return {
    normalizedPronunciation,
    segments: tokensToSegments(alignedTokens),
    tokens: alignedTokens,
    confidence: averageConfidence(alignedTokens),
    cost: Infinity,
    warnings,
  }
}

function tokensToSegments(tokens: AlignedLyricToken[]): LyricSegment[] {
  const segments: LyricSegment[] = []
  for (const token of tokens) {
    const segment = token.annotate && token.reading ? [token.surface, token.reading] : token.surface
    pushSegment(segments, segment)
  }
  return segments
}

function pushSegment(segments: LyricSegment[], segment: LyricSegment) {
  if (typeof segment === 'string' && typeof segments[segments.length - 1] === 'string') {
    segments[segments.length - 1] += segment
  } else segments.push(segment)
}

function tokenConfidence(token: PreparedToken, consumed: string, expectedDistance: number): number {
  if (token.kind === 'silent') return 1
  if (!consumed) return 0
  if (!token.expectedReadings.length) return 0.75
  const maxLength = Math.max(consumed.length, ...token.expectedReadings.map(it => it.length), 1)
  const confidence = 1 - expectedDistance / maxLength
  return token.kind === 'known' ? Math.max(0.45, confidence) : Math.max(0.1, confidence)
}

function averageConfidence(tokens: AlignedLyricToken[]): number {
  const pronounced = tokens.filter(token => token.reading || token.expectedReadings.length)
  if (!pronounced.length) return 0
  return pronounced.reduce((sum, token) => sum + token.confidence, 0) / pronounced.length
}

function editDistance(a: string, b: string): number {
  const aa = Array.from(a)
  const bb = Array.from(b)
  const dp = Array.from({ length: aa.length + 1 }, () => Array<number>(bb.length + 1).fill(0))

  for (let i = 0; i <= aa.length; i++) dp[i][0] = i
  for (let j = 0; j <= bb.length; j++) dp[0][j] = j

  for (let i = 1; i <= aa.length; i++) {
    for (let j = 1; j <= bb.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (aa[i - 1] === bb[j - 1] ? 0 : 1),
      )
    }
  }

  return dp[aa.length][bb.length]
}

function surfaceCharKind(char: string): string {
  if (containsKanji(char)) return 'kanji'
  if (isKana(char) || char === 'ー') return 'kana'
  if (latinRegex.test(char)) return 'latin'
  if (whitespaceRegex.test(char)) return 'space'
  return 'punct'
}

function containsKanji(text: string): boolean {
  return kanjiRegex.test(text)
}

function isSilentSurface(surface: string): boolean {
  return Array.from(surface).every(isSilentSurfaceChar)
}

function isSilentSurfaceChar(char: string): boolean {
  return !readingCharRegex.test(normalizePronunciationReading(char)) && !containsKanji(char) && !latinRegex.test(char)
}
