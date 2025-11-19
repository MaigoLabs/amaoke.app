import type { PageServerLoad } from './$types';
import { getPlaylist } from "$lib/server/songs.ts";

export const load: PageServerLoad = async ({ params }) => ({
  playlist: await getPlaylist(params.id)
})
