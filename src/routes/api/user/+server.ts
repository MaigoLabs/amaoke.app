import { error, json } from '@sveltejs/kit'
import { updateUserData } from '$lib/server/user'
import type { RequestHandler } from './$types'
import { login } from '$lib/server/user'

export const POST: RequestHandler = async ({ request, cookies }) => {
  const user = await login(cookies.get('session'))
  if (!user) throw error(401, 'Unauthorized')

  try {
    const data = await request.json()
    console.log(`API: Updating user data for ${user._id}`)
    await updateUserData(user, data)
    return json({ success: true })
  } catch (e) {
    console.error('Failed to update user data', e)
    return json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
