import { error, json } from '@sveltejs/kit'
import { saveResult } from '$lib/server/result'
import { getUserBySession, login } from '$lib/server/user'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json()
    const user = await login(cookies.get('session'))
    data.userId = user._id

    // Validate data here if needed
    const id = await saveResult(data)
    return json({ id })
  } catch (e) {
    console.error('Failed to save result', e)
    throw error(500, 'Internal Server Error')
  }
}
