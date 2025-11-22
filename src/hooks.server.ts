import { checkAudioSeparator } from '$lib/server/separator';

checkAudioSeparator().catch(e => console.error('Audio separator check failed:', e));
