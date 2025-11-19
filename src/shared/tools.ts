import type { NeteaseSongBrief } from "./types";

export const artistAndAlbum = (song: NeteaseSongBrief) => `${song.artists.map(it => it.name).join(', ')} - ${song.album}`