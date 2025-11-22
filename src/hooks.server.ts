import { checkAudioSeparator } from '$lib/server/separator';
import type { Handle } from '@sveltejs/kit';

checkAudioSeparator().catch(e => console.error('Audio separator check failed:', e));

export const handle: Handle = async ({ event, resolve }) => {
  const langCookie = event.cookies.get('lang');
  if (langCookie === 'zh' || langCookie === 'en') {
    event.locals.lang = langCookie;
  } else {
    const acceptLanguage = event.request.headers.get('accept-language');
    // Simple check: if zh is present, prefer it (unless en is weighted higher, but let's keep it simple for now)
    // A better parser would parse q-values.
    // For now, let's assume if 'zh' is in the header, the user likely understands Chinese.
    if (acceptLanguage && acceptLanguage.includes('zh')) {
      event.locals.lang = 'zh';
    } else {
      event.locals.lang = 'en';
    }
  }
  
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
  });
};
