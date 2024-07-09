import { ReasmpleDataOptions, resampleData } from '../helpers/utils';
// @ts-ignore
import create from 'web-worker:./worker';

const defaultPoolSize = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2;

/**
 * @module pool
 */

/**
 * Pool for workers to decode chunks of the images.
 */
class WorkerPool {
  workers: null | {
    worker: any;
    idle: boolean;
  }[];
  size: number;
  messageId: number;
  /**
   * @constructor
   * @param {Number} [size] The size of the pool. Defaults to the number of CPUs
   *                      available. When this parameter is `null` or 0, then the
   *                      decoding will be done in the main thread.
   */
  constructor(size: number = defaultPoolSize) {
    this.workers = null;
    this.size = size ?? 0;
    this.messageId = 0;
    if (size) {
      this.workers = [];
      for (let i = 0; i < size; i++) {
        this.workers.push({ worker: create(), idle: true });
      }
    }
  }

  async resample(data: Uint8Array | Int16Array | Int32Array, options: ReasmpleDataOptions): Promise<any[]> {
    return this.size === 0
      ? resampleData(data, options)
      : new Promise((resolve) => {
        const worker = this.workers.find((candidate) => candidate.idle)
          || this.workers[Math.floor(Math.random() * this.size)];
        worker.idle = false;
        const id = this.messageId++;
        const onMessage = (e) => {
          if (e.data.id === id) {
            worker.idle = true;
            resolve(e.data.data);
            worker.worker.removeEventListener('message', onMessage);
          }
        };
        worker.worker.addEventListener('message', onMessage);
        
        worker.worker.postMessage({ data, options, id });
      });
  }

  destroy() {
    if (this.workers) {
      this.workers.forEach((worker) => {
        worker.worker.terminate();
      });
      this.workers = null;
    }
  }
}

export default WorkerPool;