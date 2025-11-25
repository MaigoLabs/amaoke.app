import { error, json } from '@sveltejs/kit';
import { getSession } from '$lib/server/songs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { id } = await request.json()
    if (!id) throw error(400, 'Import ID is required')

    const session = getSession(id)
    if (!session) {
        console.log(`API: Import session ${id} not found`)
        throw error(404, 'Session not found')
    }

    return json(session);
};
