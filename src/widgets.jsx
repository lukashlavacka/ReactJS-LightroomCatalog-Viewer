var ReactGridLayout = window.ReactGridLayout.WidthProvider(window.ReactGridLayout)

var WindowDimensions = React.createClass({
    handleUpdateDimensions: function() {
        this.props.handleUpdateDimensions({width: document.body.clientWidth, height: document.body.clientHeight});
    },
    componentWillMount: function() {
        this.handleUpdateDimensions();
    },
    componentDidMount: function() {
        window.addEventListener("resize", this.handleUpdateDimensions);
    },
    componentWillUnmount: function() {
        window.removeEventListener("resize", this.handleUpdateDimensions);
    },
    render() {
    	return (
    		<div></div>
    	);
    }
});

var HiddenWidgets = React.createClass({
    render() {
        if(!this.props.widgets.length)
            return null;
        return (
            <div>
                <h2>Hidden widgets</h2>
                {this.props.widgets.map(function(w){
                    return <button key={w.key} type="button" onClick={this.props.handleShowWidget.bind(null, w)}>{w.title}</button>
                }.bind(this))}            
            </div>
        );
    }
})

window.WidgetLayout = React.createClass({
    getWidget(widget) {
        var widgetElement;
        switch(widget.key){
            case "FilterCamera":
                widgetElement = <FilterCamera db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterLens":
                widgetElement = <FilterLens db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterFlag":
                widgetElement = <FilterFlag handleFilterChange={this.props.handleFilterChange}/>
                break;
            case "FilterFace":
                widgetElement = <FilterFace db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterColor":
                widgetElement = <FilterColor handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterFocalLength":
                widgetElement = <FilterFocalLength db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterISORating":
                widgetElement = <FilterISORating db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterAperture":
                widgetElement = <FilterAperture db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterRating":
                widgetElement = <FilterRating handleFilterChange={this.props.handleFilterChange} /> 
                break;
            case "FilterDate":
                widgetElement = <FilterDate db={this.props.db} handleFilterChange={this.props.handleFilterChange} /> 
                break;
            case "PhotoStats":
                widgetElement = <PhotoStats db={this.props.db} filter={this.props.filter} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
                break;
            case "ChartViewer":
                widgetElement = <ChartViewer db={this.props.db} filter={this.props.filter} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
                break;
            case "TableViewer":
                widgetElement = <TableViewer db={this.props.db} filter={this.props.filter} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
                break;
        }

        var removeStyle = {
            position: 'absolute',
            right: '2px',
            top: 0,
            cursor: 'pointer'
        };

        return (
            <div key={widget.key} _grid={widget._grid}>
                <div>
                    <h2 className="react-grid-item-drag-handle">{widget.title}</h2>
                    {widgetElement}
                </div>
                <span className="remove" style={removeStyle} onClick={this.handleHideWidget.bind(null, widget)}>x</span>
            </div>
        )
    },
    onLayoutChange(layout) {
        this.props.saveLocalStorage("layout", layout)
    },
    getVisibleWidgets(){
        return _.differenceBy(this.state.widgets, this.state.hiddenWidgets, "key");
    },
    handleHideWidget(widget) {
        var updatedHiddenWidgets = this.state.hiddenWidgets.slice().concat([widget]);
        this.setState({
            hiddenWidgets: updatedHiddenWidgets
        });        
        if(widget.filter)
            this.props.handleFilterChange(widget.filter, undefined)

        this.props.saveLocalStorage("hiddenWidgets", updatedHiddenWidgets)
    },
    handleShowWidget(widget) {
        var updatedHiddenWidgets = this.state.hiddenWidgets.slice()
        updatedHiddenWidgets.splice(this.state.hiddenWidgets.indexOf(widget), 1);

        this.setState({
            hiddenWidgets: updatedHiddenWidgets
        });

        this.props.saveLocalStorage("hiddenWidgets", updatedHiddenWidgets)
    },
    onResize() {
    	// required to recalculate the widths of sliders
    	window.dispatchEvent(new Event('resize'));
    },
    handleResetUI() {
        this.props.saveLocalStorage("layout", [])
        this.props.saveLocalStorage("hiddenWidgets", [])

        this.setState({
            layout: [],
            hiddenWidgets: []
        });
    },
    getInitialState() {
        var ls = this.props.getLocalStorage();

        return {
            layout: ls.layout || [],
            breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
            cols: {lg: 12, md: 10, sm: 6, xs: 4, xxs: 2},
            widgets: [
                { key: "FilterCamera"       , title: "Camera"       , filter: "camera"      , _grid: { x: 0, y:  0, w:  6, h: 2 }},
                { key: "FilterLens"         , title: "Lens"         , filter: "lens"        , _grid: { x: 6, y:  0, w:  6, h: 2 }},
                { key: "FilterFlag"         , title: "Flag"         , filter: "flag"        , _grid: { x: 0, y:  2, w:  6, h: 2 }},
                { key: "FilterFace"         , title: "Face"         , filter: "face"        , _grid: { x: 6, y:  2, w:  6, h: 2 }},
                { key: "FilterColor"        , title: "Color"        , filter: "color"       , _grid: { x: 0, y:  4, w:  6, h: 2 }},
                { key: "FilterFocalLength"  , title: "Focal Length" , filter: "focalLength" , _grid: { x: 6, y:  4, w:  6, h: 2 }},
                { key: "FilterISORating"    , title: "ISO"          , filter: "iso"         , _grid: { x: 0, y:  6, w:  6, h: 2 }},
                { key: "FilterAperture"     , title: "Aperture"     , filter: "aperture"    , _grid: { x: 6, y:  6, w:  6, h: 2 }},
                { key: "FilterRating"       , title: "Rating"       , filter: "rating"      , _grid: { x: 6, y:  8, w:  6, h: 2 }},
                { key: "FilterDate"         , title: "Date"         , filter: "date"        , _grid: { x: 6, y: 10, w:  6, h: 2 }},
                { key: "PhotoStats"         , title: "Stats"        , filter: null          , _grid: { x: 6, y: 12, w:  6, h: 2 }},
                { key: "ChartViewer"        , title: "Chart"        , filter: null          , _grid: { x: 0, y:  8, w:  6, h: 6 }},
                { key: "TableViewer"        , title: "Table"        , filter: null          , _grid: { x: 0, y: 14, w: 12, h: 6 }}
            ],
            hiddenWidgets: ls.hiddenWidgets || []
        }
    },
    getDefaultProps() {
        return {
            className: "layout",
            rowHeight: 70,
            cols: 12,
            draggableHandle: ".react-grid-item-drag-handle"
        };
    },
    shouldComponentUpdate(nextProps, nextState) {
    	return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps)
    },
    render() {
    	return (
    		<div>
                <button type="button" onClick={this.handleResetUI}>Reset UI</button>
    			<HiddenWidgets widgets={this.state.hiddenWidgets} handleShowWidget={this.handleShowWidget} />
	            <ReactGridLayout className="layout" layout={this.state.layout} onLayoutChange={this.onLayoutChange} onResize={this.onResize} {...this.props} >
	                    {this.getVisibleWidgets().map(this.getWidget)}
	            </ReactGridLayout>
            </div>
    	);
    }
})