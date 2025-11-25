import { dbs } from "./db"
import { type UserDocument, type UserData } from "$lib/types.ts";
import { error } from "@sveltejs/kit";

const users = dbs.users

// Build an index once so session lookups stay fast even as the collection grows.
void users.createIndex({ sessions: 1 }, { name: "users_sessions_idx" })
void users.createIndex({ syncCode: 1 }, { name: "users_sync_code_idx" })

/**
 * Create a new user and return the session token.
 * @param registUA User's registration User Agent
 * @returns New session token
 */
export async function createUser(registUA: string): Promise<string> {
  const ses = `${crypto.randomUUID()}-${Date.now().toString(36)}`
  await users.insertOne({ registUA, createdAt: new Date(), sessions: [ses], data: {} })
  console.log(`Created new user with session ${ses}`)
  return ses
}

/**
 * Find a user by session token.
 * @returns User document or null if not found
 */
export const getUserBySession = (session: string) => users.findOne({ sessions: session })
export async function login(session?: string): Promise<UserDocument> {
  if (!session) throw error(401, 'Invalid session')
  const user = await getUserBySession(session)
  if (!user) throw error(401, 'Invalid session')
  return user
}

/**
 * 创建引继码 (sync code) 以便在其他设备登录。
 * @returns New sync code
 */
export async function createSyncCode(session: string): Promise<string> {
  const user = await login(session)

  // Sync code is 4 * 5 numbers
  const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 100000).toString().padStart(5, '0')).join('-')
  await users.updateOne({ _id: user._id }, { $set: { syncCode: code, syncCodeCreated: new Date() } })
  console.log(`Created sync code for user ${user._id}`)
  return code
}

/**
 * Update user data.
 * @param session Session token
 * @param data Data to update (partial)
 */
export async function updateUserData(user: UserDocument, data: Partial<UserData>): Promise<void> {
  const newData = { ...(user.data || {}), ...data }
  await users.updateOne({ _id: user._id }, { $set: { data: newData } })
  console.log(`Updated user data for ${user._id}`)
}

/**
 * Login with sync code.
 * @param code Sync code
 * @param newUA User Agent of the new device
 * @returns New session token
 */
export async function loginWithSyncCode(code: string, newUA: string): Promise<string> {
  const user = await users.findOne({ syncCode: code })
  if (!user) throw error(401, 'Invalid sync code')

  // Check expiration (7 days)
  if (user.syncCodeCreated && (Date.now() - user.syncCodeCreated.getTime() > 7 * 24 * 60 * 60 * 1000)) {
    await users.updateOne({ _id: user._id }, { $unset: { syncCode: "", syncCodeCreated: "" } })
    throw error(401, 'Sync code expired')
  }

  const ses = `${crypto.randomUUID()}-${Date.now().toString(36)}`

  // Add new session and clear sync code (one-time use)
  await users.updateOne(
    { _id: user._id },
    {
      $push: { sessions: ses },
      $unset: { syncCode: "", syncCodeCreated: "" }
    }
  )
  console.log(`User ${user._id} logged in with sync code`)
  
  return ses
}