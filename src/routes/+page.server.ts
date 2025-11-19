// import { log } from 'console';
import { listMyPlaylists, listRecPlaylists } from '../lib/server/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
  let last = undefined
  const { user } = await parent()
  let myPlaylists = await listMyPlaylists(user)
  let recPlaylists = await listRecPlaylists()
	return { last, myPlaylists, recPlaylists }
}