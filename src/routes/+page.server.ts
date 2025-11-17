// import { log } from 'console';
import { getSongMeta, parseBrief } from '../lib/server/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  let last = parseBrief(await getSongMeta(25723366))
	return { last }
}
