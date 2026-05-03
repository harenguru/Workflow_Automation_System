import { Queue } from 'bullmq';

function getConnectionOptions() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null as null,
    connectTimeout: 10000,
    commandTimeout: 10000,
  };
}

// Lazy singleton — created on first use, not at module load
let _queue: Queue | null = null;

function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('workflow-executions', {
      connection: getConnectionOptions(),
    });
  }
  return _queue;
}

export async function enqueueExecution(executionId: string): Promise<void> {
  const timeoutMs = 15000;
  const enqueue = getQueue().add(
    'run-execution',
    { executionId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    }
  );

  // Race against a timeout so the HTTP request never hangs forever
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Redis enqueue timed out')), timeoutMs)
  );

  await Promise.race([enqueue, timeout]);
}
