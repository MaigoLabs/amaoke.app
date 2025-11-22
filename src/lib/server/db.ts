import { MongoClient } from "mongodb"
import type { UserDocument, ResultDocument } from "../types"

export const mongo = new MongoClient(process.env.MONGO_URL || "mongodb://cat:meow@localhost:27017/")
mongo.connect()
export const db = mongo.db()

export const dbs = {
  songsRaw: db.collection('songs_raw'),
  serverProps: db.collection('server_props'),
  playlistsRaw: db.collection('playlists_raw'),
  lyricsRaw: db.collection('lyrics_raw'),
  lyricsProcessed: db.collection('lyrics_processed'),
  playlists: db.collection('playlists'),
  users: db.collection<UserDocument>('users'),
  results: db.collection<ResultDocument>('results')
}
