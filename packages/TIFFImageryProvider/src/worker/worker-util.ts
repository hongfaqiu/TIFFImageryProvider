export function onMessage(work: Worker, func: Function) {
  return async function (msg) {
    const { id, payload } = msg.data;
    if (id == null) return;

    try {
      const result = await func(payload)
      work.postMessage({ id, payload: result });
    } catch (err: any) {
      work.postMessage({ id, err: String(err) });
    }
  }
}