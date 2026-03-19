import dotenv from 'dotenv'
dotenv.config()

import { createWorker } from './queue/consumer'

const worker = createWorker()
console.log('[worker] started, listening for jobs on queue: workflow-executions')

async function shutdown() {
  console.log('[worker] shutting down...')
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
