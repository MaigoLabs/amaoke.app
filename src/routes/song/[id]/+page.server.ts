import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongRaw, listRecPlaylists } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => {
  const songId = +params.id
  const song = await getSongRaw(songId)
  const lrc = await getLyricsProcessed(songId)
  return { song, lrc }
}