import { createApp } from './index'
import { createAuth } from './auth'
import { connectDB } from './db'

const PORT = parseInt(process.env.PORT || '3001')

const db = await connectDB()
const auth = createAuth(db)
const app = createApp(auth)

app.listen(PORT)

console.log(`🦊 API running on http://localhost:${PORT}`)
console.log(`   Auth: http://localhost:${PORT}/api/auth`)
