import * as ne from '@neteasecloudmusicapienhanced/api'
import { aiParseLyrics } from './tools/lyrics'
import type { NeteaseSong, UserDocument } from '../../shared/types'
import { db } from './db'
import { franc } from 'franc'
import { error } from '@sveltejs/kit'
import type { ObjectId } from 'mongodb'
import '../../shared/ext'
import { promises as fs } from 'fs'
import path from 'path'

const CACHE_DIR = path.resolve('static/audio')

const checkNetease = async () => (await ne.login_status({}) as any).body.data.account
const eToString = (e: any) => e.message ?? e.body.message

/**
 * Functional wrapper to cache API results to MongoDB.
 * @param collectionName Name of the MongoDB collection.
 * @param fn Function to get data if not cached.
 * @param keyFn Function to get cache key from argument. Defaults to using the argument directly.
 * @returns Function that gets data from cache or calls fn and caches result.
 */
const cached = <T, R>(collectionName: string, fn: (arg: T) => Promise<R>, keyFn: (arg: T) => any = (x) => x): (arg: T, noCache?: boolean) => Promise<R> => 
    async (arg: T, noCache = false): Promise<R> => {
        const key = keyFn(arg)
        if (!noCache) {
            const doc = await db.collection(collectionName).findOne({ _id: key })
            if (doc) return doc.data
        }
        const result = await fn(arg)
        await db.collection(collectionName).replaceOne({ _id: key }, { _id: key, data: result }, { upsert: true })
        return result
    }

/**
 * Convert a playlist reference (URL or ID) to an ID number.
 */
function parsePlaylistRef(ref: string): number {
    const urlMatch = ref.match(/playlist\?id=(\d+)/)
    if (urlMatch) return +urlMatch[1]
    if (/^\d+$/.test(ref)) return +ref
    throw error(400, "无法识别歌单 URL... 只支持网易云的 URL 哦")
}

const getPlaylistRaw = cached('playlists_raw',
    async (id: number) => {
        const pl = ((await ne.playlist_detail({ id })).body as any).playlist
        for (const track of pl.tracks)
            await db.collection('songs_raw').replaceOne({ _id: track.id }, { _id: track.id, data: track }, { upsert: true })
        return pl
    })

function normalizeTimestamps(text: string): string {
    // Replace all [dd:dd:dd] wit [dd:dd.dd]
    return text.replace(/\[(\d+):(\d+):(\d+)\]/g, '[$1:$2.$3]')
      .replace(/\[(\d+):(\d+)\]/g, '[$1:$2.00]')
}

interface NeteaseLyricsResponse { lrc: { lyric: string }, lang: string }
const _getLyricsRaw = cached('lyrics_raw',
  async (songId: number) => {
    const raw = (await ne.lyric({ id: songId })).body as any as NeteaseLyricsResponse
    const lang = franc(raw.lrc.lyric.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim())
    return { ...raw, lang }
  })

const getLyricsRaw = async (songId: number): Promise<NeteaseLyricsResponse & { lang: string }> => {
  const raw = await _getLyricsRaw(songId)
  raw.lrc.lyric = normalizeTimestamps(raw.lrc.lyric)
  // Remove lines in the beginning of the lyrics that follow the pattern /\[.+\].+[:：].+/ until the first line that doesn't match
  const lines = raw.lrc.lyric.split('\n')
  let startIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^\[.+\].+[:：].+/.test(lines[i])) startIndex = i + 1
    else break
  }
  raw.lrc.lyric = lines.slice(startIndex).join('\n')
  return raw
}

export const getSongRaw = cached('songs_raw',
    async (songId: number) => {
        const detail = await ne.song_detail({ ids: songId.toString() })
        return detail.body.songs[0] as NeteaseSong
    })

export const getLyricsProcessed = cached('lyrics_processed',
    async (songId: number) => {
        const raw = await getLyricsRaw(songId)
        if (raw.lang !== 'jpn') throw error(400, 'Lyrics are not in Japanese')
        console.log(`Processing lyrics for song ${songId}`)
        return aiParseLyrics(raw.lrc.lyric)
    })

export const getSongUrl = async (id: number | string) => {
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const filePath = path.join(CACHE_DIR, `${id}/standard.mp3`)
    const publicUrl = `/audio/${id}/standard.mp3`
    if (await fs.exists(filePath)) return publicUrl

    // Check netease api status
    if (await checkNetease() === null) throw error(500, '服务器的网易云账号坏掉了 :(')

    console.log(`Downloading song ${id}...`)
    // @ts-ignore
    const res = await ne.song_url_v1({ id: id.toString(), level: 'standard' })
    const url = (res.body as any).data?.[0]?.url

    if (!url) throw error(404, '没获取到歌曲 URL（是不是被下架了）')

    const audioRes = await fetch(url)
    if (!audioRes.ok) throw error(500, '歌曲下载失败')
    
    const buffer = await audioRes.arrayBuffer()
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, Buffer.from(buffer))
    console.log(`Song ${id} cached to ${filePath}`)

    return publicUrl
}

// /////////////////////////////////////////////////////////////////////////////
// API for Song Preparation

export interface ProgressItem { task: string, progress: number }
export interface SongProcessState { items: ProgressItem[], status: 'running' | 'done' | 'error' }

const songProcessingStatus = new Map<number, SongProcessState>()
export const getSongStatus = (songId: number) => songProcessingStatus.get(songId) || { items: [], status: 'idle' }
export const checkLyricsProcessed = async (songId: number) => !!await db.collection('lyrics_processed').findOne({ _id: songId as any })
export const prepareSong = async (songId: number) => {
    if (songProcessingStatus.has(songId)) return

    const state: SongProcessState = { items: [], status: 'running' }
    songProcessingStatus.set(songId, state)

    const addTask = (task: string) => ({ task, progress: 0 }).also(it => state.items.push(it))
    try {
        // 1. Get Lyrics
        const taskLyrics = addTask('从网易云获取歌词')
        const raw = await getLyricsRaw(songId)
        taskLyrics.progress = 1
        
        if (raw.lang !== 'jpn') {
             addTask('错误: 不是日语歌曲').progress = -1
             return state.status = 'error'
        }

        // 2. AI Process
        const taskAI = addTask('AI 标注歌词读音')
        
        // Check cache
        if (await checkLyricsProcessed(songId)) taskAI.progress = 1
        else {
            const lrc = await aiParseLyrics(raw.lrc.lyric, (i, n) => taskAI.progress = i / n)
            await db.collection('lyrics_processed').replaceOne({ _id: songId as any }, { _id: songId, data: lrc }, { upsert: true })
            taskAI.progress = 1
        }

        // 3. Audio
        const taskAudio = addTask('从网易云获取音乐')
        await getSongUrl(songId)
        taskAudio.progress = 1
        
        state.status = 'done'

    } catch (e) {
        addTask(`错误: ${eToString(e)}`).progress = -1
        state.status = 'error'
    }
}


// /////////////////////////////////////////////////////////////////////////////
// API for Netease Import

export interface ImportSession {
    id: string
    playlistId: number
    userId?: any
    songs: {
        song: NeteaseSong
        status: 'importing' | 'success' | 'failed-not-japanese' | 'failed-unknown'
    }[]
    done: boolean
}
const sessions = new Map<string, ImportSession>()

export const getSession = (id: string) => sessions.get(id)

/**
 * Start an import session
 * @param link Netease playlist link
 * @param userId User ID to associate the imported playlist with
 * @returns Import session
 */
export async function startImport(link: string, userId?: number): Promise<ImportSession> {
    const meta = await getPlaylistRaw(parsePlaylistRef(link))
    const importId = crypto.randomUUID()
    
    const session: ImportSession = {
        id: importId,
        playlistId: meta.id,
        userId,
        songs: meta.tracks.map((s: any) => ({ song: s, status: 'importing' })),
        done: false
    }

    // If there is another session importing the same playlist, return it
    if (sessions.has(importId)) {
        console.log(`Import session ${importId} already exists`)
        return sessions.get(importId)!
    }
    sessions.set(importId, session)
    
    // Start background processing
    processImport(session, meta).catch(err => console.error('Import failed', err))
    
    return session
}

/**
 * Process an import session
 * @param session Session to store data for retriving progress
 * @param data Playlist metadata
 */
async function processImport(session: ImportSession, data: any) {
    console.log(`Starting import: Playlist ${session.playlistId}`)
    data.tracks = (await Promise.all(session.songs.map(async item => {
        try {
            const lyrics = await getLyricsRaw(item.song.id)
            console.log(`Song ${item.song.id} lang ${lyrics.lang}`)
            if (lyrics.lang === 'jpn') {
                item.status = 'success'
                return item.song
            } else item.status = 'failed-not-japanese'
        } catch (e) {
            console.error(`Failed to process song ${item.song.id}`, e)
            item.status = 'failed-unknown'
        }
    }))).filter(it => it !== undefined)

    session.done = true

    // Save to database
    await db.collection('playlists').replaceOne(
        { _id: session.playlistId as any },
        { _id: session.playlistId, data, importedAt: new Date() },
        { upsert: true }
    )
    
    // Add to user's favorites
    session.userId?.let(async (uid: any) => await db.collection('users').updateOne(
        { _id: uid },
        { $addToSet: { "data.myPlaylists": session.playlistId } }
    ))
}


// /////////////////////////////////////////////////////////////////////////////
// Default playlists and recommendation

// TODO: A better recommendation system
const defaultPlaylists = [17463338036, 13555799996, 14348145982, 14392963638]
export const listRecPlaylists = async () => {
    const list = await db.collection('playlists').find({
        _id: { $in: defaultPlaylists }
    } as any).map(it => it.data).toArray()
    return list.sort((a: any, b: any) => defaultPlaylists.indexOf(a.id) - defaultPlaylists.indexOf(b.id))
}
export const listMyPlaylists = async (user: UserDocument) => (await user.data.myPlaylists?.let(pl => db.collection('playlists').find({
  _id: { $in: pl as any as ObjectId[] }
}).map(it => it.data).toArray())) ?? []

export const getPlaylist = async (playlistId: number | string) => {
    const plData = await db.collection('playlists').findOne({ _id: +playlistId as any })
    if (!plData) throw error(404, 'Playlist not found')
    return plData.data
}

// Check if there are any playlists, if not, import default ones
(async () => {
    const count = await db.collection('playlists').countDocuments()
    if (count === 0) {
        console.log("No playlists found. Importing default playlists...")
        await Promise.all(defaultPlaylists.map(async (id) => await startImport(id.toString())))
    }
})()
