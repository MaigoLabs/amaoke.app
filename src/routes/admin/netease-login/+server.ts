import * as ne from '@neteasecloudmusicapienhanced/api'
import { error, json } from '@sveltejs/kit'
import { loginWithSyncCode } from '$lib/server/user'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'

const globalSession = {
  key: "",
  qrImg: "",
}

async function createQr() {
  globalSession.key = (await ne.login_qr_key({}) as any).body.data.unikey
  globalSession.qrImg = (await ne.login_qr_create({ key: globalSession.key, qrimg: true }) as any).body.data.qrimg
}

export const POST: RequestHandler = async ({ request, cookies }) => {
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
    await db.collection('server_props').updateOne(
      { name: 'global_settings' },
      { $set: { netease_login_cookie: check.cookie } },
      { upsert: true }
    )
    return json({ code: 803, cookie: check.cookie })
  }
  throw error(500, `未知返回值 ${check.code}`)
}
