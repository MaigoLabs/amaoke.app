import { getSongRaw, getPlaylist } from "$lib/server/songs"

export const load = async ({ params, parent }) => {
    const { user } = await parent()
    const songId = +params.id
    const song = await getSongRaw(songId)
    const playlist = await user.data?.loc?.currentPlaylistId?.let(getPlaylist)

    return { song, playlist }
}
