import { error, json } from '@sveltejs/kit';
import { startImport } from '$lib/server/neteaseImport';
import { login } from '$lib/server/user';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { link } = await request.json();
    if (!link) throw error(400, 'Link is required')

    const user = await login(cookies.get('session'))
    if (!user) throw error(401, 'Unauthorized');

    try {
        return json(await startImport(link, user))
    } catch (e) {
        console.error(e)
        throw error(500, 'Failed to start import')
    }
};
