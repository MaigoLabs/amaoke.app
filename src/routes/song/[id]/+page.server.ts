import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongRaw, getSongUrl } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => {
  const songId = +params.id
  const song = await getSongRaw(songId)
  const lrc = await getLyricsProcessed(songId)
  // const audioUrl = await getSongUrl(songId)
  return { song, lrc, audioUrl: undefined }
}