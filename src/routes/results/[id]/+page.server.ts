import { error } from '@sveltejs/kit'
import { getResult } from '$lib/server/result'
import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongMeta, parseBrief } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => {
  const result = await getResult(params.id)
  if (!result) throw error(404, 'Result not found')

  const song = await getSongMeta(result.songId)

  return { 
    result: structuredClone(result),
    lrc: await getLyricsProcessed(result.songId),
    song, brief: parseBrief(song)
  }
}
