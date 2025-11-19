import type { PageServerLoad } from './$types';
import { listMyPlaylists, listRecPlaylists } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent()
  const isMine = params.category === 'my'
  const playlists = isMine ? await listMyPlaylists(user) : await listRecPlaylists()
  return { playlists, isMine }
}