import { Worker } from 'bullmq';
import { runExecution } from '../engine/workflowEngine';

function getConnectionOptions() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null as null,
    connectTimeout: 10000,
  };
}

export function createWorker(): Worker {
  const worker = new Worker(
    'workflow-executions',
    async (job) => {
      if (job.name === 'run-execution') {
        const { executionId } = job.data as { executionId: string };
        await runExecution(executionId);
      }
    },
    { connection: getConnectionOptions() }
  );

  worker.on('error', (err) => {
    console.error('[worker] error:', err);
  });

  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.id} completed`);
  });

  return worker;
}
