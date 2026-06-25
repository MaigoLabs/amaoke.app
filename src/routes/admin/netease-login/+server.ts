import ne from '@neteasecloudmusicapienhanced/api'
import { error, json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'

const globalSession = {
  key: "",
  qrImg: "",
  cookie: "",
  lastLog: "",
}

const smsSession = {
  phone: "",
  ctcode: "",
  cookie: "",
}

interface NeteaseResponse {
  body: any
  cookie?: string[]
  status?: number
}

const defaultCtcode = '86'
const smsLoginPlatform = 'ios'

function setCookiesToCookieHeader(setCookies?: string[]) {
  return setCookies
    ?.map(cookie => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ') ?? ''
}

function mergeCookieHeaders(current: string, setCookies?: string[]) {
  const merged = new Map<string, string>()
  const addCookie = (cookie: string) => {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (!name || valueParts.length === 0) return
    merged.set(name, valueParts.join('='))
  }

  current.split(';').forEach(addCookie)
  setCookiesToCookieHeader(setCookies).split(';').forEach(addCookie)

  return [...merged].map(([name, value]) => `${name}=${value}`).join('; ')
}

function cookieHasMusicU(cookie?: string) {
  return Boolean(cookie?.split(';').some(part => part.trim().startsWith('MUSIC_U=')))
}

function cookieNames(cookie?: string) {
  return cookie
    ?.split(';')
    .map(part => part.trim().split('=')[0])
    .filter(Boolean) ?? []
}

function setCookieNames(cookies?: string[]) {
  return cookies
    ?.map(cookie => cookie.split(';')[0]?.trim().split('=')[0])
    .filter(Boolean) ?? []
}

function logQrStatus(code: number, bodyCookie?: string, setCookies?: string[]) {
  const marker = `${code}:${cookieHasMusicU(bodyCookie)}:${setCookieNames(setCookies).join(',')}`
  if (marker === globalSession.lastLog) return
  globalSession.lastLog = marker
  console.info('NetEase QR status', {
    code,
    hasBodyCookie: Boolean(bodyCookie),
    hasMusicU: cookieHasMusicU(bodyCookie),
    bodyCookieNames: cookieNames(bodyCookie),
    setCookieNames: setCookieNames(setCookies),
  })
}

async function callNetease(
  fn: () => Promise<NeteaseResponse>,
  fallback: string,
  onErrorCookies?: (cookies: string[]) => void
): Promise<NeteaseResponse> {
  try {
    return await fn()
  } catch (e: any) {
    if (e?.cookie?.length) onErrorCookies?.(e.cookie)
    throw error(apiErrorStatus(e?.status ?? e?.body?.code), apiErrorMessage(e?.body ?? e, fallback))
  }
}

async function createQr() {
  const key = await callNetease(() => ne.login_qr_key({}) as any, 'Failed to create NetEase QR login key')
  globalSession.key = key.body.data.unikey
  globalSession.lastLog = ""
  globalSession.cookie = mergeCookieHeaders(globalSession.cookie, key.cookie)
  globalSession.qrImg = (await callNetease(
    () => ne.login_qr_create({ key: globalSession.key, qrimg: true, cookie: globalSession.cookie }) as any,
    'Failed to create NetEase QR code'
  )).body.data.qrimg
}

async function saveLoginCookie(cookie?: string) {
  if (!cookie) throw error(500, 'NetEase login did not return a cookie')
  if (!cookieHasMusicU(cookie)) throw error(500, 'NetEase login did not return a MUSIC_U cookie')
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
  const message = body?.message ?? body?.msg ?? body?.message?.toString?.()
  return body?.code ? `${message ?? fallback} (${body.code})` : message ?? fallback
}

export const POST: RequestHandler = async ({ request }) => {
  const { action = 'qr-check', pwd, phone, captcha, ctcode } = await request.json().catch(() => ({}))
  if (env.ADMIN_PASSWORD && pwd !== env.ADMIN_PASSWORD) {
    throw error(403, 'Invalid password')
  }

  if (action === 'sms-send') {
    if (!phone) throw error(400, 'Phone number is required')

    const countryCode = ctcode || defaultCtcode
    const sent = await callNetease(
      () => ne.captcha_sent({
        phone,
        ctcode: countryCode,
        cookie: smsSession.cookie,
        platform: smsLoginPlatform
      }) as any,
      'Failed to send SMS code',
      cookies => smsSession.cookie = mergeCookieHeaders(smsSession.cookie, cookies)
    )
    const res = sent.body
    if (res.code !== 200) throw error(apiErrorStatus(res.code), apiErrorMessage(res, 'Failed to send SMS code'))

    smsSession.phone = phone
    smsSession.ctcode = countryCode
    smsSession.cookie = mergeCookieHeaders(smsSession.cookie, sent.cookie)

    return json({ code: 200 })
  }

  if (action === 'sms-login') {
    if (!phone) throw error(400, 'Phone number is required')
    if (!captcha) throw error(400, 'SMS code is required')

    const countryCode = ctcode || defaultCtcode
    const cookie = smsSession.phone === phone && smsSession.ctcode === countryCode ? smsSession.cookie : ''
    const loginRes = await callNetease(
      () => ne.login_cellphone({
        phone,
        captcha,
        countrycode: countryCode,
        cookie,
        platform: smsLoginPlatform
      }) as any,
      'NetEase SMS login failed',
      cookies => smsSession.cookie = mergeCookieHeaders(smsSession.cookie, cookies)
    )
    const login = loginRes.body
    if (login.code !== 200) throw error(apiErrorStatus(login.code), apiErrorMessage(login, 'NetEase SMS login failed'))

    await saveLoginCookie(login.cookie)
    return json({ code: 803, cookie: login.cookie })
  }

  if (action !== 'qr-check') throw error(400, 'Unknown login action')

  if (!globalSession.key) await createQr()

  // Check key validity
  const checkRes = await callNetease(
    () => ne.login_qr_check({ key: globalSession.key, cookie: globalSession.cookie }) as any,
    'NetEase QR login failed',
    cookies => globalSession.cookie = mergeCookieHeaders(globalSession.cookie, cookies)
  )
  const check = checkRes.body
  globalSession.cookie = mergeCookieHeaders(globalSession.cookie, checkRes.cookie)
  logQrStatus(check.code, check.cookie, checkRes.cookie)
  // 800: 过期, 801: 等待扫码, 802/8821: 等待确认, 803: 登录成功
  if (check.code === 800) {
    await createQr()
    check.code = 801
  }
  if (check.code === 801) return json({ code: 801, img: globalSession.qrImg })
  if (check.code === 802 || check.code === 8821) return json({ code: 802 })
  if (check.code === 803) {
    await saveLoginCookie(check.cookie)
    return json({ code: 803, cookie: check.cookie })
  }
  if (check.code === 502) throw error(400, apiErrorMessage(check, 'NetEase QR login failed'))
  throw error(500, `未知返回值 ${check.code}`)
}
