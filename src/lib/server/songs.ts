import * as ne from '@neteasecloudmusicapienhanced/api'
import { aiParseLyrics } from './tools/lyrics'
import type { NeteaseSongBrief } from '../../shared/types'
import { db } from './db'

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

/**
 * Get raw playlist data from cache or netease API.
 */
export const getPlaylistRaw = cached('playlists',
    async (id: number) => {
        const pl = ((await ne.playlist_detail({ id })).body as any)

        // Save each song
        for (const track of pl.playlist.tracks) {
            await db.collection('songs').replaceOne({ _id: track.id }, { _id: track.id, data: track }, { upsert: true })
        }
        return pl
    })

export const listPlaylists = () => db.collection('playlists').find()
  .map(it => it.data.playlist).toArray()

export const getSongMeta = cached('songs',
    async (songId: number) => {
        const detail = await ne.song_detail({ ids: songId.toString() })
        return detail.body.songs[0]
    })

export const parseBrief = (songData: any): NeteaseSongBrief => ({
    id: songData.id,
    name: songData.name,
    album: songData.al.name,
    albumId: songData.al.id,
    albumPic: songData.al.picUrl,
    artists: songData.ar.map((ar: any) => ({ id: ar.id, name: ar.name }))
})

/**
 * Get a list of songs from a playlist reference.
 */
export async function getSongsFromPlaylist(ref: string): Promise<{meta: any, songs: NeteaseSongBrief[]}> {
    const playlistId = parsePlaylistRef(ref)
    const plData = await getPlaylistRaw(playlistId)
    return {meta: plData.playlist, songs: plData.playlist.tracks.map(parseBrief)}
}

interface NeteaseLyricsResponse { lrc: { lyric: string } }

export const getLyricsRaw = cached('lyrics_raw',
    async (songId: number) => (await ne.lyric({ id: songId })).body as any as NeteaseLyricsResponse
)

export const getLyricsProcessed = cached('lyrics_processed',
    async (songId: number) => {
        const raw = await getLyricsRaw(songId)
        return aiParseLyrics(raw.lrc.lyric)
    })

await getSongsFromPlaylist("13555799996")
await getSongsFromPlaylist("https://music.163.com/playlist?id=14348145982")
await getSongsFromPlaylist("https://music.163.com/playlist?id=14392963638")
await getSongsFromPlaylist("https://music.163.com/playlist?id=580208139")

// TODO: Filter out non-Japanese songs
