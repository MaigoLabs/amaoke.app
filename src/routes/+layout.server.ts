import { createUser, login } from '$lib/server/user'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, request, locals }) => {
  let session = cookies.get('session')

  const registUA = request.headers.get('user-agent') || ''

  if (!session) {
    // Create new user
    session = await createUser(registUA)
    cookies.set('session', session, {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
  }

  try {
    const user = structuredClone(await login(session))
    return { user, lang: locals.lang }
  } catch (e) {
    // Invalid session, create new
    session = await createUser(registUA)
    cookies.set('session', session, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365
    })
    const user = structuredClone(await login(session))
    return { user, lang: locals.lang }
  }
}