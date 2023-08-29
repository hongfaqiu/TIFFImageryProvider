const resolves = {};
const rejects = {};
let globalMsgId = 0; // Activate calculation in the worker, returning a promise

async function sendMessage<T = any, U = any>(worker: Worker, payload: T) {
  const msgId = globalMsgId++;
  const msg = {
    id: msgId,
    payload,
  };
  return new Promise<U>(function (resolve, reject) {
    // save callbacks for later
    resolves[msgId] = resolve;
    rejects[msgId] = reject;
    worker.postMessage(msg);
  });
} // Handle incoming calculation result

function handleMessage(msg: any) {
  const { id, err, payload } = msg.data;
  if (payload) {
    const resolve = resolves[id];
    if (resolve) {
      resolve(payload);
    }
  } else {
    // error condition
    const reject = rejects[id];
    if (reject) {
      if (err) {
        reject(err);
      } else {
        reject("Got nothing");
      }
    }
  }

  // purge used callbacks
  delete resolves[id];
  delete rejects[id];
}

class WorkerFarm {
  constructor(public worker: Worker) {
    this.worker.onmessage = handleMessage;
  }

  async scheduleTask<T = any, U = any>(options: T) {
    return await sendMessage<T, U>(this.worker, options);
  }

  destory() {
    this.worker?.terminate();
    this.worker = undefined;
  }
}

export default WorkerFarm;
