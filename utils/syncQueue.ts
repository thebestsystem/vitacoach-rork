type SyncTask<T = any> = {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
  timestamp: number;
};

class SyncQueue {
  private queue: SyncTask[] = [];
  private processing = false;
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingDebounced = new Map<string, SyncTask>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly debounceMs = 500;

  async enqueue<T>(
    taskId: string,
    fn: () => Promise<T>,
    options?: { debounce?: boolean; priority?: boolean }
  ): Promise<T> {
    const { debounce = true, priority = false } = options || {};

    if (debounce) {
      const existingTimer = this.debounceTimers.get(taskId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        const existingTask = this.pendingDebounced.get(taskId);
        if (existingTask) {
          existingTask.reject(new Error('Task superseded by newer request'));
        }
      }

      return new Promise<T>((resolve, reject) => {
        const task: SyncTask<T> = {
          id: taskId,
          fn,
          resolve,
          reject,
          retries: 0,
          timestamp: Date.now(),
        };
        
        this.pendingDebounced.set(taskId, task as SyncTask);
        
        const timer = setTimeout(() => {
          this.debounceTimers.delete(taskId);
          this.pendingDebounced.delete(taskId);
          this.addTask(taskId, fn, resolve, reject, priority);
        }, this.debounceMs);

        this.debounceTimers.set(taskId, timer);
      });
    }

    return new Promise<T>((resolve, reject) => {
      this.addTask(taskId, fn, resolve, reject, priority);
    });
  }

  private addTask<T>(
    id: string,
    fn: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
    priority: boolean
  ) {
    const existingIndex = this.queue.findIndex((task) => task.id === id);
    if (existingIndex !== -1) {
      this.queue.splice(existingIndex, 1);
    }

    const task: SyncTask<T> = {
      id,
      fn,
      resolve,
      reject,
      retries: 0,
      timestamp: Date.now(),
    };

    if (priority) {
      this.queue.unshift(task);
    } else {
      this.queue.push(task);
    }

    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue[0];

      try {
        console.log(`[SyncQueue] Processing task: ${task.id}`);
        const result = await task.fn();
        this.queue.shift();
        task.resolve(result);
        console.log(`[SyncQueue] Task completed: ${task.id}`);
      } catch (error) {
        console.error(`[SyncQueue] Task failed: ${task.id}`, error);
        
        task.retries++;
        
        if (task.retries >= this.maxRetries) {
          console.error(`[SyncQueue] Task failed after ${this.maxRetries} retries: ${task.id}`);
          this.queue.shift();
          task.reject(error);
        } else {
          console.log(`[SyncQueue] Retrying task ${task.id} (attempt ${task.retries + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * task.retries));
        }
      }
    }

    this.processing = false;
  }

  clearDebounce(taskId: string) {
    const timer = this.debounceTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(taskId);
    }
    const pendingTask = this.pendingDebounced.get(taskId);
    if (pendingTask) {
      pendingTask.reject(new Error('Task cancelled'));
      this.pendingDebounced.delete(taskId);
    }
  }

  clear() {
    this.queue = [];
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.pendingDebounced.forEach(task => task.reject(new Error('Queue cleared')));
    this.pendingDebounced.clear();
    this.processing = false;
  }

  get pendingCount() {
    return this.queue.length;
  }

  get isProcessing() {
    return this.processing;
  }
}

export const syncQueue = new SyncQueue();

export function createQueuedSync<TArgs extends any[], TReturn>(
  taskIdGenerator: (...args: TArgs) => string,
  syncFn: (...args: TArgs) => Promise<TReturn>,
  options?: { debounce?: boolean; priority?: boolean }
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const taskId = taskIdGenerator(...args);
    return syncQueue.enqueue(taskId, () => syncFn(...args), options);
  };
}
