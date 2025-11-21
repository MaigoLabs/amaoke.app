import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongRaw, getSongUrl, checkLyricsProcessed } from "$lib/server/songs.ts"
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params }) => {
  const songId = +params.id
  const song = await getSongRaw(songId)
  const hasLrc = await checkLyricsProcessed(songId)
  
  if (!hasLrc) throw redirect(302, `/song/${songId}`)

  const lrc = await getLyricsProcessed(songId)!
  // const audioUrl = await getSongUrl(songId)
  return { song, lrc, audioUrl: undefined }
}