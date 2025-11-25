import { json } from '@sveltejs/kit'
import { prepareSong, getSongStatus } from '$lib/server/songs'

export async function POST({ params }) {
    const songId = +params.id
    console.log(`API: Requesting preparation for song ${songId}`)
    prepareSong(songId) // Start in background
    return json({ status: 'started' })
}

export async function GET({ params }) {
    const songId = +params.id
    const status = getSongStatus(songId)
    return json({ status })
}
