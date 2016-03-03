import { defer } from 'q'
import SQL from 'sql.js'

export class SyncWorkerWrapper {
	constructor(workerPath) {
	}

	open = (buffer) => {
		var deferred = defer();
		this.db = new SQL.Database(buffer)

		setTimeout(() => {
			deferred.resolve()
		}, 0)

        return deferred.promise
    }

	exec = (query) => {
		var deferred = defer();

		setTimeout(() => {
			deferred.resolve(this.db.exec(query));
		}, 0)

        return deferred.promise
	}
}

export default class WorkerWrapper {
	constructor(workerPath) {
	    this.id = 0;
	    this.promises = {}
	    this.worker = new Worker(workerPath);

	    this.worker.onmessage = (event) => {
	    	var promise = this.promises[event.data.id]
	    	console.log("Last query '" + promise.query + "' took " + (new Date() - promise.timestamp) + "ms");

	    	promise.deferred.resolve(event.data.results)
	        delete this.promises[event.data.id];
	    }
	}

	open = (buffer) => {
        this.id++;
        var deferred = defer();
        this.promises[this.id] = {
        	deferred: deferred,
        	timestamp: new Date()
        };

        this.worker.postMessage({
            id: this.id,
            action: "open",
            buffer: buffer
        })

        return deferred.promise
    }

	exec = (query) => {
        this.id++;
        var deferred = defer();
        this.promises[this.id] = {
        	deferred: deferred,
        	query: query,
        	timestamp: new Date()
        };

        this.worker.postMessage({
            id: this.id,
            action: "exec",
            sql: query
        })

        return deferred.promise
	}
}