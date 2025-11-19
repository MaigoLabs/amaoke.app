import { getSongsFromPlaylist, getLyricsRaw } from './songs'
import { db } from './db'
import type { NeteaseSongBrief } from '../../shared/types'

export interface ImportSession {
    id: string
    playlistId: number
    songs: {
        song: NeteaseSongBrief
        status: 'importing' | 'success' | 'failed-not-japanese' | 'failed-unknown'
    }[]
    done: boolean
}

const sessions = new Map<string, ImportSession>()

export const getSession = (id: string) => sessions.get(id)

/**
 * Start an import session
 * @param link Netease playlist link
 * @returns Import session
 */
export async function startImport(link: string): Promise<ImportSession> {
    const { meta, songs } = await getSongsFromPlaylist(link)
    const importId = crypto.randomUUID()
    
    const session: ImportSession = {
        id: importId,
        playlistId: meta.id,
        songs: songs.map(s => ({ song: s, status: 'importing' })),
        done: false
    }

    // If there is another session importing the same playlist, return it
    if (sessions.has(importId)) {
        console.log(`Import session ${importId} already exists`)
        return sessions.get(importId)!
    }
    
    sessions.set(importId, session)
    
    // Start background processing
    processImport(session).catch(err => console.error('Import failed', err))
    
    return session
}

/**
 * Process an import session
 * @param session Session to store data for retriving progress
 */
async function processImport(session: ImportSession) {
    const validSongs: NeteaseSongBrief[] = []
    console.log(`Starting import: Playlist ${session.playlistId}`)

    for (let i = 0; i < session.songs.length; i++) {
        const item = session.songs[i]
        try {
            console.log(`Processing song ${item.song.id}`)
            const lyrics = await getLyricsRaw(item.song.id)
            if (lyrics.lang === 'jpn') {
                item.status = 'success'
                console.log(`Song ${item.song.id} is valid`)
                validSongs.push(item.song)
            } else {
                item.status = 'failed-not-japanese'
                console.log(`Song ${item.song.id} is not Japanese (is ${lyrics.lang})`)
            }
        } catch (e) {
            console.error(`Failed to process song ${item.song.id}`, e)
            item.status = 'failed-unknown'
        }
    }

    session.done = true

    // Save to database
    if (validSongs.length > 0) {
        await db.collection('playlists_imported').replaceOne(
            { _id: session.playlistId as any },
            { 
                _id: session.playlistId, 
                songs: validSongs,
                importedAt: new Date()
            },
            { upsert: true }
        )
    }
}
