export type LyricSegment = string | string[]

export interface LyricLine {
    time: string
    lyric: LyricSegment[]
}

export interface Song {
    title: string
    lyrics: LyricLine[]
}

export interface NeteaseSongBrief { 
    id: number
    name: string
    album: string
    albumId: number
    albumPic: string
    artists: { id: number, name: string }[]
}

export interface ProcessedLyricLine {
    jp: LyricSegment[]
    kanji: string
    hiragana: string
    cleanHiragana: string
    romaji: string
    cleanRomaji: string
}

export interface DisplayCharacter {
    char: string
    state: 'correct' | 'incorrect' | 'untyped' | 'ignored'
    originalSegment?: LyricSegment
    segmentHiragana?: string
}

export interface GameStats {
    wpm: number
    accuracy: number
    totalTyped: number
    totalCorrect: number
    startTime: number
    totalTime: number
}
