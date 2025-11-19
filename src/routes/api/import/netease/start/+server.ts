import { error, json } from '@sveltejs/kit';
import { startImport } from '$lib/server/neteaseImport';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { link } = await request.json();
    if (!link) throw error(400, 'Link is required')

    try {
        const session = await startImport(link)
        return json(session)
    } catch (e) {
        console.error(e)
        throw error(500, 'Failed to start import')
    }
};
