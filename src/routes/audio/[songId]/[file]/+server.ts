import { getAudioFile } from '$lib/server/songs';
import { error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const { songId, file } = params;
    const filePath = getAudioFile(songId, file);

    try {
        await fs.access(filePath);
    } catch {
        throw error(404, 'File not found');
    }

    const ext = path.extname(file).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    if (ext === '.opus') contentType = 'audio/ogg';

    const buffer = await fs.readFile(filePath);

    return new Response(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000'
        }
    });
};
