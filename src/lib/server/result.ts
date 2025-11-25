import type { ResultDocument } from "../types"
import { dbs } from "./db"
import { ObjectId } from "mongodb"

export async function saveResult(data: Omit<ResultDocument, "_id" | "createdAt">): Promise<string> {
  const doc = { ...data, createdAt: new Date() }
  const res = await dbs.results.insertOne(doc)
  console.log(`Saved result ${res.insertedId} for user ${data.userId}`)
  return res.insertedId.toString()
}

export async function getResult(id: string): Promise<ResultDocument | null> {
  try {
    console.log(`Getting result ${id}`)
    return await dbs.results.findOne({ _id: new ObjectId(id) })
  } catch {
    return null
  }
}
