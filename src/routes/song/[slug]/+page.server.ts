import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongMeta, listPlaylists, parseBrief } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => {
  const songId = +params.slug
  const raw = await getSongMeta(songId)
  const brief = parseBrief(raw)
  const lrc = await getLyricsProcessed(songId)
  return { raw, brief, lrc }
}