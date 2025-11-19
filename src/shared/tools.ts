import type { NeteaseSong } from "./types";

export const artistAndAlbum = (song: NeteaseSong) => `${song.ar.map(it => it.name).join(', ')} - ${song.al.name}`