import type { ResultDocument } from "../types"
import { dbs } from "./db"
import { ObjectId } from "mongodb"

export async function saveResult(data: Omit<ResultDocument, "_id" | "createdAt">): Promise<string> {
  const doc = { ...data, createdAt: new Date() }
  const res = await dbs.results.insertOne(doc)
  return res.insertedId.toString()
}

export async function getResult(id: string): Promise<ResultDocument | null> {
  try {
    return await dbs.results.findOne({ _id: new ObjectId(id) })
  } catch {
    return null
  }
}
