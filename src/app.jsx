var ReactGridLayout = window.ReactGridLayout.WidthProvider(window.ReactGridLayout)

window.BootstrapRow = React.createClass({
    render() {
    	// var width = this.props.width || 12
    	// var widths = {
    	// 	xs : this.props.xs || width,
    	// 	sm : this.props.sm || this.props.xs || width,
    	// 	md : this.props.md || this.props.sm || this.props.xs || width,
    	// 	lg : this.props.lg || this.props.md || this.props.sm || this.props.xs || width,
    	// }
    	// var classes = _(widths)
    	// 	.mapValues(function(value, key){ return "col-" + key + "-" + value})
    	// 	.values()
    	// 	.join(" ");

     //    var children;
     //    if(Array.isArray(this.props.children)) {
     //        children = this.props.children.map(function(c, i){
     //                return <div key={i} className={classes}>{c}</div>
     //            }.bind(this));
     //    }
     //    else {
     //        children = <div className={classes}>{this.props.children}</div>
     //    }
        // return (
        //     <div className="row">                
        //         {children}
        //     </div>
        // );
        return (
            <div {...this.props}>
                {this.props.children}
            </div>
        )
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
    	this.handleStatusChange("Requesting catalogue");        
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
    parseData(data, now)
    {
		var Uints = new Uint8Array(data);
		var db = new SQL.Database(Uints);        
        this.handleProgress("end")
		this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.", "success");
		this.setState({
			db: db
		})
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
    getDefaultProps() {
        return {
            className: "layout",
            rowHeight: 150,
            cols: 12,
            draggableHandle: ".react-grid-item-drag-handle"
        };
    },
    onLayoutChange() {
    },
    getInitialState() {
        return {
            db: undefined,
            filter: {},
            layout: [
                { i:"FilterCamera"      , x: 0, y: 1, w:  6, h: 1 },
                { i:"FilterLens"        , x: 6, y: 1, w:  6, h: 1 },
                { i:"FilterFlag"        , x: 0, y: 2, w:  6, h: 1 },
                { i:"FilterFace"        , x: 6, y: 2, w:  6, h: 1 },
                { i:"FilterColor"       , x: 0, y: 3, w:  6, h: 1 },
                { i:"FilterFocalLength" , x: 6, y: 3, w:  6, h: 1 },
                { i:"FilterISORating"   , x: 0, y: 4, w:  6, h: 1 },
                { i:"FilterAperture"    , x: 6, y: 4, w:  6, h: 1 },
                { i:"FilterRating"      , x: 0, y: 5, w:  6, h: 1 },
                { i:"PhotoStats"        , x: 6, y: 5, w:  6, h: 1 },
                { i:"ChartViewer"       , x: 0, y: 6, w: 12, h: 2 },
                { i:"TableViewer"       , x: 0, y: 7, w: 12, h: 2 },
            ]
        }
    },
    render() {
        var content;
    	if(this.state.db) {
            content = 
                <ReactGridLayout className="layout" layout={this.state.layout} onLayoutChange={this.onLayoutChange}  {...this.props} >
                    <FilterCamera key="FilterCamera" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterLens key="FilterLens" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterFlag key="FilterFlag" handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterFace key="FilterFace" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterColor key="FilterColor" handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterFocalLength key="FilterFocalLength" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterISORating key="FilterISORating" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterAperture key="FilterAperture" db={this.state.db} handleFilterChange={this.handleFilterChange} {...this.props} />
                    <FilterRating key="FilterRating" handleFilterChange={this.props.handleFilterChange} {...this.props} />  
                    <PhotoStats key="PhotoStats" db={this.state.db} filter={this.state.filter} handleStatusChange={this.handleStatusChange} handleProgress={this.handleProgress} {...this.props} />
                    <ChartViewer key="ChartViewer" db={this.state.db} filter={this.state.filter} handleStatusChange={this.handleStatusChange} handleProgress={this.handleProgress} {...this.props} />
                    <TableViewer key="TableViewer" db={this.state.db} filter={this.state.filter} handleStatusChange={this.handleStatusChange} handleProgress={this.handleProgress} {...this.props} />
                </ReactGridLayout>
    	}   
        else {
            content = <BootstrapRow>
                    <p>Click this button to load <button className="btn btn-default" type="button" onClick={this.handleLoadDefaultFile}>test catalogue</button> or drop anywhere on the page a Lightroom catalogue file.</p>
                </BootstrapRow>;
        } 
        return (
            <FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange} >
            	<h1>Welcome to Lightroom Catalogue Reader</h1>
                {content}
            </FileDropWrapper>
        );
    }
})

ReactDOM.render(
    <Interface />,
    document.getElementById('content')
);