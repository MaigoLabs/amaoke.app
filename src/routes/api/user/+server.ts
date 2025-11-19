import { json } from '@sveltejs/kit'
import { updateUserData } from '$lib/server/user'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, cookies }) => {
  const session = cookies.get('session')
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    await updateUserData(session, data)
    return json({ success: true })
  } catch (e) {
    console.error('Failed to update user data', e)
    return json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
