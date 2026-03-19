import { Queue } from 'bullmq';

function getConnectionOptions() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null as null,
  };
}

const queue = new Queue('workflow-executions', { connection: getConnectionOptions() });

export async function enqueueExecution(executionId: string): Promise<void> {
  await queue.add(
    'run-execution',
    { executionId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    }
  );
}
