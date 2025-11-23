import type { NeteasePlaylist, UserData } from "$lib/types"

export function getNextSong(playlist?: NeteasePlaylist, loc?: NonNullable<UserData['loc']>) {
  if (!playlist || !loc) return null
  if (loc.playMode === 'random') {
    const unplayed = playlist.tracks.filter(t => !loc.playedSongIds.includes(t.id))
    if (unplayed.length > 0) {
      return unplayed[Math.floor(Math.random() * unplayed.length)].id
    }
  } else {
    const nextIndex = loc.currentSongIndex + 1
    if (nextIndex < playlist.tracks.length) {
      return playlist.tracks[nextIndex].id
    }
  }
  return null
}

export function getNextLoc(playlist: NeteasePlaylist, loc: NonNullable<UserData['loc']>, nextSongId: number): NonNullable<UserData['loc']> {
  const nextIndex = playlist.tracks.findIndex(t => t.id === nextSongId)
  return {
    ...loc,
    currentSongIndex: nextIndex,
    isFinished: false,
    playedSongIds: loc.playedSongIds.includes(nextSongId) 
    ? loc.playedSongIds 
    : [...loc.playedSongIds, nextSongId]
  }
}
