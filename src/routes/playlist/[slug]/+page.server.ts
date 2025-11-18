import type { PageServerLoad } from './$types';
import { getSongsFromPlaylist, listPlaylists } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => ({
  playlist: await getSongsFromPlaylist(params.slug)
})
