window.BootstrapRow = React.createClass({
    render() {
    	var width = this.props.width || 12
    	var widths = {
    		xs : this.props.xs || width,
    		sm : this.props.sm || this.props.xs || width,
    		md : this.props.md || this.props.sm || this.props.xs || width,
    		lg : this.props.lg || this.props.md || this.props.sm || this.props.xs || width,
    	}
    	var classes = _(widths)
    		.mapValues(function(value, key){ return "col-" + key + "-" + value})
    		.values()
    		.join(" ");

        var children;
        if(Array.isArray(this.props.children)) {
            children = this.props.children.map(function(c, i){
                    return <div key={i} className={classes}>{c}</div>
                }.bind(this));
        }
        else {
            children = <div className={classes}>{this.props.children}</div>
        }
        return (
            <div className="row">                
                {children}
            </div>
        );
    }
})

window.LoadingWrapper = React.createClass({
    render() {
        var className = this.props.loading ? "loading" : null
        return (
            <div className={className}>{this.props.children}</div>
        );
    }
})

var FileDropWrapper = React.createClass({
    onDragEnter (event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    },
    onDragLeave (event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drag any Lightroom catalog file", "none")
    },
    onDragOver (event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    },
    onDrop(event){
        event.stopPropagation();
        event.preventDefault();

        var dt = event.dataTransfer;
        var files = dt.files;

        if(files && files.length && files[0])
            this.props.handleFileChange(files[0]);
    },
    render() {
        return (
            <div style={{ height: "100%" }} onDrop={this.onDrop} onDragEnter={this.onDragEnter} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave}>
                {this.props.children}
            </div>
        );
    }
})

window.Interface = React.createClass({
    handleFileChange(file) {
        this.handleProgress("start")
        this.handleStatusChange("Loading...");        
        var now = new Date();
        var sqlReader = new FileReader();
        sqlReader.onload = function() {
           this.parseData(sqlReader.result, now);
        }.bind(this);
        sqlReader.onprogress = function(e) {
            this.handleProgress("progress", e.loaded / e.total)
        }.bind(this);
        sqlReader.readAsArrayBuffer(file);
    },
    handleLoadDefaultFile(event) {
    	this.handleStatusChange("Requesting catalog");        
        this.handleProgress("start")
        var now = new Date();
    	var xhr = new XMLHttpRequest();
		xhr.open('GET', 'test/TestLR.lrcat', true);
		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
			this.parseData(xhr.response, now);
		}.bind(this);
        xhr.onprogress = function(e) {
            this.handleProgress("progress", e.loaded / e.total)
        }.bind(this);
		xhr.send();
    },
    parseData(data, now) {
		var Uints = new Uint8Array(data);
        this.state.worker.open(Uints).then(function() {            
            this.handleProgress("end")
            this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.", "success");
            this.setState({
                dbReady: true
            })
        }.bind(this))
    },
    handleStatusChange(status, statusType) {
        console.log(status)
    	return;
    },
    handleProgress(event, value) {
        switch(event)
        {
            case "start":
                NProgress.start()
                break;
            case "progress":
                value ? NProgress.set(value) : NProgress.inc();
                break;
            case "end":
                NProgress.done()
                break;
        }
    },
    handleFilterChange(filterType, value) {
        var temp = {};
        temp[filterType] = { $set: value };
        var newFilter = React.addons.update(this.state.filter, temp);
             
        this.setState({
            filter: newFilter
        });
    },
    saveLocalStorage(field, value) {
        var ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer')) || {};
            } catch(e) {/*ignore*/}
        }
        ls[field] = value;
        if (window.localStorage) {
            window.localStorage.setItem('ReactJs-LightroomCatalog-Viewer', JSON.stringify(ls));
        }
    },
    getLocalStorage() {
        var ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer')) || {};
            } catch(e) {/*ignore*/}
        }
        return ls;
    },
    getInitialState() {
        return {
            worker: undefined,
            dbReady: false,
            filter: {}
        }
    },
    componentWillMount() {
        var worker = new WorkerWrapper(new Worker("lib/worker.sql.js"))
        this.setState({worker: worker})
    },
    componentWillUnmount() {
        this.state.worker.terminate();
    },
    render() {
        var content;
    	if(this.state.dbReady) {
            content = 
            <div>
                <WidgetLayout worker={this.state.worker} hiddenWidgets={this.state.hiddenWidgets} filter={this.state.filter} handleStatusChange={this.handleStatusChange} handleFilterChange={this.handleFilterChange} saveLocalStorage={this.saveLocalStorage} getLocalStorage={this.getLocalStorage}/>
            </div>
    	}   
        else {
            content = <BootstrapRow>
                    <p>Click this button to load <button className="btn btn-default" type="button" onClick={this.handleLoadDefaultFile}>test catalog</button> or drop anywhere on the page a Lightroom catalog file.</p>
                </BootstrapRow>;
        } 
        return (
            <FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange} >
            	<h1>Welcome to Lightroom Catalog Reader</h1>
                {content}
            </FileDropWrapper>
        );
    }
})

ReactDOM.render(
    <Interface />,
    document.getElementById('content')
);

function WorkerWrapper(worker) {
    this.id = 0;
    this.promises = {}
    this.worker = worker;

    this.open = function(buffer) {
        this.id++;
        var deferred = Q.defer();
        this.promises[this.id] = deferred;

        this.worker.postMessage({
            id: this.id,
            action: "open",
            buffer: buffer
        })

        return deferred.promise
    }.bind(this)

    this.exec = function(query) {
        this.id++;
        var deferred = Q.defer();
        this.promises[this.id] = deferred;

        this.worker.postMessage({
            id: this.id,
            action: "exec",
            sql: query
        })

        return deferred.promise
    }.bind(this)

    this.worker.onmessage = function(event) {
        this.promises[event.data.id].resolve(event.data.results)
        delete this.promises[event.data.id];
    }.bind(this)
}