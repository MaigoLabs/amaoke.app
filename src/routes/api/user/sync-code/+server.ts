import { error, json } from '@sveltejs/kit'
import { createSyncCode } from '$lib/server/user'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ cookies }) => {
  const session = cookies.get('session')
  if (!session) throw error(401, 'Unauthorized')

  const code = await createSyncCode(session)
  return json({ code })
}
