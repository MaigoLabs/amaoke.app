// import { log } from 'console';
import { getSongMeta, listMyPlaylists, listRecPlaylists, parseBrief } from '../lib/server/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
  let last = parseBrief(await getSongMeta(25723366))
  const { user } = await parent()
  let myPlaylists = await listMyPlaylists(user)
  let recPlaylists = await listRecPlaylists()
	return { last, myPlaylists, recPlaylists }
}