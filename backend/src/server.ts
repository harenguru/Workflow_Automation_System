import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../.env') })

import app from './index'
import prisma from './lib/prisma'

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  // Warm up DB connection on startup so first request isn't slow
  prisma.$queryRaw`SELECT 1`.catch(() => {})
})

// Keep Neon DB awake — ping every 4 minutes to prevent cold starts
setInterval(() => {
  prisma.$queryRaw`SELECT 1`.catch(() => {})
}, 4 * 60 * 1000)
