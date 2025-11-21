import { getSongRaw } from "$lib/server/songs"

export const load = async ({ params }) => {
    const song = await getSongRaw(+params.id)
    return { song }
}
