import type { PageServerLoad } from './$types';
import { listPlaylists } from "$lib/server/songs.ts";

// TODO: slug should be "my" or "recommended", fetch accordingly
export const load: PageServerLoad = async ({ params }) => {
  const isMine = params.slug === 'my'
  return {
    playlists: await listPlaylists(),
    isMine
  }
}