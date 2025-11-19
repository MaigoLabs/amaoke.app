import type { PageServerLoad } from './$types';
import { getSongsFromPlaylist, listRecPlaylists } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => ({
  playlist: await getSongsFromPlaylist(params.id)
})
