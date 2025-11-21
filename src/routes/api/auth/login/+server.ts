import { error, json } from '@sveltejs/kit'
import { loginWithSyncCode } from '$lib/server/user'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { code } = await request.json()
  if (!code) throw error(400, 'Missing sync code')

  const ua = request.headers.get('user-agent') || 'unknown'
  const session = await loginWithSyncCode(code, ua)
  
  // Set session cookie
  cookies.set('session', session, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365 // 1 year
  })

  return json({ success: true })
}
