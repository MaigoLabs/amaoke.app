// import { log } from 'console';
import { getSongMeta, getSongsFromPlaylist, listPlaylists, parseBrief } from '../lib/server/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  let last = parseBrief(await getSongMeta(25723366))
  let myPlaylists = await listPlaylists()
  let recPlaylists = myPlaylists
	return { last, myPlaylists, recPlaylists }
}