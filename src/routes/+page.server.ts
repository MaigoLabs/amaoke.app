// import { log } from 'console';
import { listMyPlaylists, listRecPlaylists, getPlaylist } from '../lib/server/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
  let last = undefined
  const { user } = await parent()
  
  if (user?.data?.loc) {
    try {
      const playlist = await getPlaylist(user.data.loc.currentPlaylistId);
      if (playlist) {
        last = playlist.tracks[user.data.loc.currentSongIndex];
      }
    } catch (e) {
      console.error("Failed to load last playlist", e);
    }
  }

  let myPlaylists = await listMyPlaylists(user)
  let recPlaylists = await listRecPlaylists()
	return { last, myPlaylists, recPlaylists }
}