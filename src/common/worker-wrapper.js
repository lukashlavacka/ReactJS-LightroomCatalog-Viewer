// @flow

import type {
  RawData,
  SqlMessageEventData,
  SQLType,
  SQLDatabase
} from "./types";

const SQL = (window.SQL: SQLType); // sql.js seems not to be working when loaded using package or dynamic loading

export interface IWorkerWrapper {
  open(buffer: Uint8Array): Promise<void>,
  exec(query: string): Promise<?RawData>
}

export class SyncWorkerWrapper implements IWorkerWrapper {
  db: SQLDatabase;

  open = (buffer: Uint8Array) => {
    this.db = (SQL && SQL.Database && new SQL.Database(buffer)) || null;
    return Promise.resolve();
  };

  exec = (query: string) => {
    return Promise.resolve(this.db.exec(query));
  };
}

export class AsyncWorkerWrapper implements IWorkerWrapper {
  promises: {
    [query_id: number]: {
      query: string,
      timestamp: Date,
      resolve: (result?: RawData) => void
    }
  } = {};
  id = 0;
  worker: Worker;

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath);

    this.worker.onmessage = (event: MessageEvent) => {
      const eventData = ((event.data: any): SqlMessageEventData);
      const promiseObject = this.promises[eventData.id];
      window.console.log(
        `Last query "${promiseObject.query}" took ${new Date() -
          promiseObject.timestamp}ms`
      );
      promiseObject.resolve(eventData.results);
      delete this.promises[eventData.id];
    };
  }

  open = (buffer: Uint8Array) => {
    this.id = this.id + 1;

    const promise = new Promise((resolve: () => void) => {
      this.promises[this.id] = {
        resolve,
        query: "Open DB",
        timestamp: new Date()
      };
    });

    this.worker.postMessage({
      id: this.id,
      action: "open",
      buffer
    });

    return promise;
  };

  exec = (query: string) => {
    this.id = this.id + 1;
    const promise = new Promise((resolve: (result?: RawData) => void) => {
      this.promises[this.id] = {
        resolve,
        query,
        timestamp: new Date()
      };
    });

    this.worker.postMessage({
      id: this.id,
      action: "exec",
      sql: query
    });

    return promise;
  };
}
