import { db } from "./db"
import type { UserDocument, UserData } from "../../shared/types.ts";

const users = db.collection<UserDocument>("users")

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
  await users.insertOne({ registUA, createdAt: new Date(), sessions: [ses] })
  return ses
}

/**
 * Find a user by session token.
 * @returns User document or null if not found
 */
export const getUserBySession = (session: string) => users.findOne({ sessions: session })
export async function login(session: string): Promise<UserDocument> {
  const user = await getUserBySession(session)
  if (!user) throw new Error('Invalid session')
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
  return code
}

/**
 * Update user data.
 * @param session Session token
 * @param data Data to update (partial)
 */
export async function updateUserData(session: string, data: Partial<UserData>): Promise<void> {
  const user = await login(session)
  const newData = { ...(user.data || {}), ...data }
  await users.updateOne({ _id: user._id }, { $set: { data: newData } })
}