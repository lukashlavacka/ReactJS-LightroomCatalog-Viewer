import q, { defer } from "q";

export default class AbstractWorkerWrapper {}

export class SyncWorkerWrapper extends AbstractWorkerWrapper {
  open = buffer => {
    this.db = new window.SQL.Database(buffer);
    return q();
  };

  exec = query => {
    return q(this.db.exec(query));
  };
}

export class AsyncWorkerWrapper extends AbstractWorkerWrapper {
  promises = {};
  id = 0;

  constructor(workerPath) {
    super(workerPath);

    this.worker = new Worker(workerPath);

    this.worker.onmessage = event => {
      const promise = this.promises[event.data.id];
      window.console.log(
        `Last query "${promise.query}" took ${new Date() - promise.timestamp}ms`
      );
      promise.deferred.resolve(event.data.results || {});
      delete this.promises[event.data.id];
    };
  }

  open = buffer => {
    this.id = this.id + 1;
    const deferred = defer();
    this.promises[this.id] = {
      deferred,
      timestamp: new Date()
    };

    this.worker.postMessage({
      id: this.id,
      action: "open",
      buffer
    });

    return deferred.promise;
  };

  exec = query => {
    this.id = this.id + 1;
    const deferred = defer();
    this.promises[this.id] = {
      deferred,
      query,
      timestamp: new Date()
    };

    this.worker.postMessage({
      id: this.id,
      action: "exec",
      sql: query
    });

    return deferred.promise;
  };
}
