import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongMeta, listRecPlaylists, parseBrief } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => {
  const songId = +params.id
  const raw = await getSongMeta(songId)
  const brief = parseBrief(raw)
  const lrc = await getLyricsProcessed(songId)
  return { raw, brief, lrc }
}