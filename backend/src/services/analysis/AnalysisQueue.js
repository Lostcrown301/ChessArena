import { logger as defaultLogger } from '../../config/logger.js';

export class AnalysisQueue {
  constructor({ logger = defaultLogger } = {}) {
    this.logger = logger;
    this.tail = Promise.resolve();
    this.pendingCount = 0;
  }

  enqueue(task) {
    this.pendingCount += 1;

    const runTask = async () => {
      try {
        return await task();
      } finally {
        this.pendingCount -= 1;
      }
    };

    const queuedTask = this.tail.then(runTask, runTask);
    this.tail = queuedTask.catch((error) => {
      this.logger.warn({ err: error }, 'Analysis queue task failed');
    });

    return queuedTask;
  }
}

export const analysisQueue = new AnalysisQueue();
