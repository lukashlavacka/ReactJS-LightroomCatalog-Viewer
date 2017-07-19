const SQL = window.SQL; // sql.js seems not to be working when loaded using package or dynamic loading

export default class AbstractWorkerWrapper {}

export class SyncWorkerWrapper extends AbstractWorkerWrapper {
  open = buffer => {
    this.db = new SQL.Database(buffer);
    return Promise.resolve();
  };

  exec = query => {
    return Promise.resolve(this.db.exec(query));
  };
}

export class AsyncWorkerWrapper extends AbstractWorkerWrapper {
  promises = {};
  id = 0;

  constructor(workerPath) {
    super(workerPath);

    this.worker = new Worker(workerPath);

    this.worker.onmessage = event => {
      const promiseObject = this.promises[event.data.id];
      window.console.log(
        `Last query "${promiseObject.query}" took ${new Date() -
          promiseObject.timestamp}ms`
      );
      promiseObject.resolve(event.data.results || {});
      delete this.promises[event.data.id];
    };
  }

  open = buffer => {
    this.id = this.id + 1;

    const promise = new Promise(
      resolve =>
        (this.promises[this.id] = {
          resolve,
          query: "Open DB",
          timestamp: new Date()
        })
    );

    this.worker.postMessage({
      id: this.id,
      action: "open",
      buffer
    });

    return promise;
  };

  exec = query => {
    this.id = this.id + 1;
    const promise = new Promise(
      resolve =>
        (this.promises[this.id] = {
          resolve,
          query,
          timestamp: new Date()
        })
    );

    this.worker.postMessage({
      id: this.id,
      action: "exec",
      sql: query
    });

    return promise;
  };
}
