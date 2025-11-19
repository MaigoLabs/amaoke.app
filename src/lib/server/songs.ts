import * as ne from '@neteasecloudmusicapienhanced/api'
import { aiParseLyrics } from './tools/lyrics'
import type { NeteaseSong, UserDocument } from '../../shared/types'
import { db } from './db'
import { franc } from 'franc'
import { error } from '@sveltejs/kit'
import type { ObjectId } from 'mongodb'
import '../../shared/ext'

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
    throw new Error('Invalid playlist reference')
}

const getPlaylistRaw = cached('playlists_raw',
    async (id: number) => {
        const pl = ((await ne.playlist_detail({ id })).body as any).playlist

        // Save each song
        for (const track of pl.tracks)
            await db.collection('songs_raw').replaceOne({ _id: track.id }, { _id: track.id, data: track }, { upsert: true })

        return pl
    })

function normalizeTimestamps(text: string): string {
    // Replace all [dd:dd:dd] wit [dd:dd.dd]
    return text.replace(/\[(\d+):(\d+):(\d+)\]/g, '[$1:$2.$3]')
}

interface NeteaseLyricsResponse { lrc: { lyric: string }, lang: string }
const getLyricsRaw = cached('lyrics_raw',
    async (songId: number) => {
        const raw = (await ne.lyric({ id: songId })).body as any as NeteaseLyricsResponse
        const lang = franc(raw.lrc.lyric.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim())
        raw.lrc.lyric = normalizeTimestamps(raw.lrc.lyric)
        return { ...raw, lang }
    })

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




// TODO: A better recommendation system
export const listRecPlaylists = async () => await db.collection('playlists').find().limit(10).map(it => it.data).toArray()
export const listMyPlaylists = async (user: UserDocument) => (await user.data.myPlaylists?.let(pl => db.collection('playlists').find({
  _id: { $in: pl as any as ObjectId[] }
}).map(it => it.data).toArray())) ?? []

export const getPlaylist = async (playlistId: number | string) => {
    const plData = await db.collection('playlists').findOne({ _id: +playlistId as any })
    if (!plData) throw error(404, 'Playlist not found')
    return plData.data
}

await startImport("13555799996")
await startImport("https://music.163.com/playlist?id=14348145982")
await startImport("https://music.163.com/playlist?id=14392963638")
await startImport("https://music.163.com/playlist?id=580208139")
await startImport("https://music.163.com/playlist?id=17404030548")

// TODO: Filter out non-Japanese songs
