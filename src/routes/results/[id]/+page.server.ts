import { error } from '@sveltejs/kit'
import { getResult } from '$lib/server/result'
import type { PageServerLoad } from './$types'
import { getLyricsProcessed, getSongRaw, getPlaylist } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent()
  const result = await getResult(params.id)
  if (!result) throw error(404, 'Result not found')

  const song = await getSongRaw(result.songId)

  return { 
    result: structuredClone(result),
    lrc: await getLyricsProcessed(result.songId),
    song,
    playlist: await user.data?.loc?.currentPlaylistId?.let(getPlaylist)
  }
}
