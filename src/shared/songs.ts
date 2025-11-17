import * as ne from '@neteasecloudmusicapienhanced/api';
import * as fs from 'fs/promises';
import * as path from 'path';
import { aiParseLyrics } from './lyricsParse';

// Filesystem structure:
// $data/playlists/{playlistId}/detail.json
// $data/songs/{songId}/meta.json
// $data/songs/{songId}/cover.jpg
// $data/songs/{songId}/lyrics.json
// $data/songs/{songId}/lyricsProcessed.json

/**
 * Functional wrapper to cache API results to filesystem.
 * @param filePath Function to get cache file path from argument.
 * @param fn Function to get data if not cached.
 * @returns Function that gets data from cache or calls fn and caches result.
 */
const cached = <T, R>(filePath: (arg: T) => Promise<string>, fn: (arg: T) => Promise<R>): (arg: T, noCache?: boolean) => Promise<R> => 
    async (arg: T, noCache = false): Promise<R> => {
        const file = await filePath(arg)
        if (!noCache && await fs.stat(file).catch(() => false)) {
            const data = await fs.readFile(file, 'utf-8')
            return JSON.parse(data) as R
        }
        const result = await fn(arg)
        await fs.mkdir(path.dirname(file), { recursive: true })
        await fs.writeFile(file, JSON.stringify(result), 'utf-8')
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
const getPlaylistRaw = cached(
    async ({ id }: { id: number }) => path.join('data', 'playlists', `${id}`, 'detail.json'),
    async ({ id }: { id: number }) => {
        const pl = ((await ne.playlist_detail({ id })).body as any)

        // Save each song
        for (const track of pl.playlist.tracks) {
            const p = path.join('data', 'songs', `${track.id}`, 'meta.json')
            await fs.mkdir(path.dirname(p), { recursive: true })
            await fs.writeFile(p, JSON.stringify(track), 'utf-8')
        }
        return pl
    })

export const getSongMeta = cached(
    async (songId: number) => path.join('data', 'songs', `${songId}`, 'meta.json'),
    async (songId: number) => {
        const detail = await ne.song_detail({ ids: songId.toString() })
        return detail.body.songs[0]
    })

export interface NeteaseSongBrief { 
    id: number
    name: string
    album: string
    albumId: number
    albumPic: string
    artists: { id: number, name: string }[]
}

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
export async function getSongsFromPlaylist(ref: string): Promise<any[]> {
    const playlistId = parsePlaylistRef(ref)
    const plData = await getPlaylistRaw({ id: playlistId })
    return plData.playlist.tracks.map(parseBrief)
}

interface NeteaseLyricsResponse { lrc: { lyric: string } }

export const getLyricsRaw = cached(
    async (songId: number) => path.join('data', 'songs', `${songId}`, 'lyrics.json'),
    async (songId: number) => (await ne.lyric({ id: songId })).body as any as NeteaseLyricsResponse
)

export const getLyricsProcessed = cached(
    async (songId: number) => path.join('data', 'songs', `${songId}`, 'lyricsProcessed.json'),
    async (songId: number) => {
        const raw = await getLyricsRaw(songId)
        return aiParseLyrics(raw.lrc.lyric)
    }
)

// console.log((await getSongsFromPlaylist('580208139')).length)
// console.log(await getLyricsProcessed(25723366))