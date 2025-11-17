import { MongoClient } from "mongodb"

export const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://cat:meow@localhost:27017/kashi")
mongo.connect()
export const db = mongo.db()


