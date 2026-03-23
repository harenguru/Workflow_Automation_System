import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../.env') })

import app from './index'
import prisma from './lib/prisma'
import { createWorker } from './queue/consumer'

const PORT = process.env.PORT ?? 3000

// Start API server
app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`)
  prisma.$queryRaw`SELECT 1`.catch(() => {})
})

// Keep Neon DB awake every 4 minutes
setInterval(() => {
  prisma.$queryRaw`SELECT 1`.catch(() => {})
}, 4 * 60 * 1000)

// Start BullMQ worker in the same process
const worker = createWorker()
console.log('[worker] started, listening for jobs on queue: workflow-executions')

async function shutdown() {
  console.log('[combined] shutting down...')
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
