import { MongoClient, Db } from 'mongodb'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/content-enhancer'

let client: MongoClient
let db: Db

export async function connectDB(): Promise<Db> {
  if (db) return db

  // Connect MongoDB native driver (for Better Auth adapter)
  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  })

  try {
    await client.connect()
    db = client.db()
    await db.command({ ping: 1 })
    console.log(`MongoDB connected: ${db.databaseName}`)
  } catch (error) {
    console.error('MongoDB connection failed:', (error as Error).message)
    console.error('Make sure MongoDB is running: mongod --dbpath /tmp/mongodb-data')
    process.exit(1)
  }

  // Connect Mongoose (for custom models: Persona, Config, UsageEvent)
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    })
    console.log('Mongoose connected')
  } catch (error) {
    console.error('Mongoose connection failed:', (error as Error).message)
    process.exit(1)
  }

  return db
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected. Call connectDB() first.')
  return db
}

export async function disconnectDB(): Promise<void> {
  if (client) await client.close()
  await mongoose.disconnect()
}
