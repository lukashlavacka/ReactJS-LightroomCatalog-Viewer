import { defer } from "q";
import SQL from "sql.js";

export default class AbstractWorkerWrapper {}

export class SyncWorkerWrapper extends AbstractWorkerWrapper {
  open = buffer => {
    const deferred = defer();
    this.db = new SQL.Database(buffer);

    setTimeout(() => {
      deferred.resolve();
    }, 0);

    return deferred.promise;
  };

  exec = query => {
    const deferred = defer();

    setTimeout(() => {
      deferred.resolve(this.db.exec(query));
    }, 0);

    return deferred.promise;
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
