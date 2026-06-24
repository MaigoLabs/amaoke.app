import ne from '@neteasecloudmusicapienhanced/api'
import { error, json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'

const globalSession = {
  key: "",
  qrImg: "",
}

const defaultCtcode = '86'

async function createQr() {
  globalSession.key = (await ne.login_qr_key({}) as any).body.data.unikey
  globalSession.qrImg = (await ne.login_qr_create({ key: globalSession.key, qrimg: true }) as any).body.data.qrimg
}

async function saveLoginCookie(cookie?: string) {
  if (!cookie) throw error(500, 'NetEase login did not return a cookie')
  await db.collection('server_props').updateOne(
    { name: 'global_settings' },
    { $set: { netease_login_cookie: cookie } },
    { upsert: true }
  )
}

function apiErrorStatus(code?: number) {
  return code && code >= 400 && code < 600 ? code : 400
}

function apiErrorMessage(body: any, fallback: string) {
  const message = body?.message ?? body?.msg
  return body?.code ? `${message ?? fallback} (${body.code})` : message ?? fallback
}

export const POST: RequestHandler = async ({ request }) => {
  const { action = 'qr-check', pwd, phone, captcha, ctcode } = await request.json().catch(() => ({}))
  if (env.ADMIN_PASSWORD && pwd !== env.ADMIN_PASSWORD) {
    throw error(403, 'Invalid password')
  }

  if (action === 'sms-send') {
    if (!phone) throw error(400, 'Phone number is required')

    const res = (await ne.captcha_sent({ phone, ctcode: ctcode || defaultCtcode }) as any).body
    if (res.code !== 200) throw error(apiErrorStatus(res.code), apiErrorMessage(res, 'Failed to send SMS code'))

    return json({ code: 200 })
  }

  if (action === 'sms-login') {
    if (!phone) throw error(400, 'Phone number is required')
    if (!captcha) throw error(400, 'SMS code is required')

    const login = (await ne.login_cellphone({
      phone,
      captcha,
      countrycode: ctcode || defaultCtcode
    }) as any).body
    if (login.code !== 200) throw error(apiErrorStatus(login.code), apiErrorMessage(login, 'NetEase SMS login failed'))

    await saveLoginCookie(login.cookie)
    return json({ code: 803, cookie: login.cookie })
  }

  if (action !== 'qr-check') throw error(400, 'Unknown login action')

  if (!globalSession.key) await createQr()

  // Check key validity
  const check = (await ne.login_qr_check({ key: globalSession.key }) as any).body
  // 800: 过期, 801: 等待扫码, 802: 等待确认, 803: 登录成功
  if (check.code === 800) {
    await createQr()
    check.code = 801
  }
  if (check.code === 801) return json({ code: 801, img: globalSession.qrImg })
  if (check.code === 802) return json({ code: 802 })
  if (check.code === 803) {
    await saveLoginCookie(check.cookie)
    return json({ code: 803, cookie: check.cookie })
  }
  throw error(500, `未知返回值 ${check.code}`)
}
