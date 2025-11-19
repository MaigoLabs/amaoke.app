import type { ResultDocument } from "../../shared/types"
import { db } from "./db"
import { ObjectId } from "mongodb"

const results = db.collection<ResultDocument>("results")

export async function saveResult(data: Omit<ResultDocument, "_id" | "createdAt">): Promise<string> {
  const doc = { ...data, createdAt: new Date() }
  const res = await results.insertOne(doc)
  return res.insertedId.toString()
}

export async function getResult(id: string): Promise<ResultDocument | null> {
  try {
    return await results.findOne({ _id: new ObjectId(id) })
  } catch {
    return null
  }
}
