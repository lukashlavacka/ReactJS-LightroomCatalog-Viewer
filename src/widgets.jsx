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

window.WidgetLayout = React.createClass({
    getWidget(widget) {
        var widgetElement;
        switch(widget.key){
            case "FilterCamera":
                widgetElement = <FilterCamera worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterLens":
                widgetElement = <FilterLens worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterFlag":
                widgetElement = <FilterFlag handleFilterChange={this.props.handleFilterChange}/>
                break;
            case "FilterFace":
                widgetElement = <FilterFace worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterColor":
                widgetElement = <FilterColor handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterFocalLength":
                widgetElement = <FilterFocalLength worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterISORating":
                widgetElement = <FilterISORating worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterAperture":
                widgetElement = <FilterAperture worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} />
                break;
            case "FilterRating":
                widgetElement = <FilterRating handleFilterChange={this.props.handleFilterChange} /> 
                break;
            case "FilterShutter":
                widgetElement = <FilterShutter worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} /> 
                break;
            case "FilterDate":
                widgetElement = <FilterDate worker={this.props.worker} handleFilterChange={this.props.handleFilterChange} /> 
                break;
            case "PhotoStats":
                widgetElement = <PhotoStats worker={this.props.worker} filter={this.props.filter} />
                break;
            case "ChartViewer":
                widgetElement = <ChartViewer worker={this.props.worker} filter={this.props.filter} />
                break;
            case "TableViewer":
                widgetElement = <TableViewer worker={this.props.worker} filter={this.props.filter} />
                break;
        }

        var minified = (_.find(this.state.layout, { i : widget.key }) || { }).h == 1;
        return (
            <div key={widget.key} _grid={widget._grid}>
                <WidgetWrapper title={widget.title} minified={minified} handleMinifyWidget={this.handleMinifyWidget.bind(this, widget)} >
                    {widgetElement}
                </WidgetWrapper>
            </div>
        )
    },
    onLayoutChange(layout, layouts) {
        this.setState({
            layout: layout,
            layouts: layouts
        })
        this.props.saveLocalStorage("layout", layout)
        this.props.saveLocalStorage("layouts", layouts)
    },
    handleMinifyWidget(widget) {
        var layout = this.state.layout;

        var newLayout = _.cloneDeep(layout);     
        var widgetLayoutIndex =  _.findIndex(newLayout, {i: widget.key});
        var oldWidgetLayout = layout[widgetLayoutIndex];
        var newMinified = oldWidgetLayout.h > 1;

        var minifidWidgetCount = _.filter(layout, {h : 1}).length;

        var newWidgetLayout;
        if(newMinified) {
            newWidgetLayout = _.extend({}, oldWidgetLayout, {
                h: 1,
                w: 1,
                x: minifidWidgetCount % this.props.cols,
                y: Math.floor(minifidWidgetCount / this.props.cols),
                isResizable: false,
                static: true,
                prevLayout: _.clone(oldWidgetLayout)
            })
        }
        else {
            newWidgetLayout = oldWidgetLayout.prevLayout;
        }

        _.forEach(newLayout, function(w){ w.y += w.h > 1 ? 1 : 0})


        newLayout.splice(widgetLayoutIndex, 1, newWidgetLayout)

        this.setState({ layout: newLayout });        
        this.props.saveLocalStorage("layout", newLayout)
    },
    triggerResize() {
    	// required to recalculate the widths of sliders
    	window.dispatchEvent(new Event('resize'));
    },
    handleResetUI() {
        this.props.saveLocalStorage("layout", [])
        this.props.saveLocalStorage("layouts", {})

        this.setState({
            layout: [],
            layouts: {}
        });
    },
    getInitialState() {
        var ls = this.props.getLocalStorage();
        return {
            layout: ls.layout || [],
            layouts: ls.layouts || {},
            widgets: [
                { key: "FilterCamera"       , title: "Camera"        , filter: "camera"      , _grid: { x: 0, y:  1, w: 3, h: 2, minH: 2 }},
                { key: "FilterLens"         , title: "Lens"          , filter: "lens"        , _grid: { x: 6, y:  1, w: 3, h: 2, minH: 2 }},
                { key: "FilterFlag"         , title: "Flag"          , filter: "flag"        , _grid: { x: 0, y:  3, w: 3, h: 2, minH: 2 }},
                { key: "FilterFace"         , title: "Face"          , filter: "face"        , _grid: { x: 6, y:  4, w: 3, h: 2, minH: 2 }},
                { key: "FilterColor"        , title: "Color"         , filter: "color"       , _grid: { x: 0, y:  4, w: 3, h: 2, minH: 2 }},
                { key: "FilterFocalLength"  , title: "Focal Length"  , filter: "focalLength" , _grid: { x: 6, y:  4, w: 3, h: 2, minH: 2 }},
                { key: "FilterISORating"    , title: "ISO"           , filter: "iso"         , _grid: { x: 0, y:  7, w: 3, h: 2, minH: 2 }},
                { key: "FilterAperture"     , title: "Aperture"      , filter: "aperture"    , _grid: { x: 6, y:  7, w: 3, h: 2, minH: 2 }},
                { key: "FilterRating"       , title: "Rating"        , filter: "rating"      , _grid: { x: 6, y:  9, w: 3, h: 2, minH: 2 }},
                { key: "ChartViewer"        , title: "Chart"         , filter: null          , _grid: { x: 0, y:  9, w: 3, h: 6, minH: 2 }},
                { key: "FilterShutter"      , title: "Shutter Speed" , filter: "shuter"      , _grid: { x: 6, y:  9, w: 3, h: 2, minH: 2 }},
                { key: "FilterDate"         , title: "Date"          , filter: "date"        , _grid: { x: 6, y: 11, w: 3, h: 2, minH: 2 }},
                { key: "PhotoStats"         , title: "Most Popular"  , filter: null          , _grid: { x: 0, y: 13, w: 6, h: 2, minH: 2 }},
                { key: "TableViewer"        , title: "Table"         , filter: null          , _grid: { x: 0, y: 15, w: 6, h: 6, minH: 2 }}
            ]
        }
    },
    getDefaultProps() {
        return {
            className: "layout",
            // breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
            cols: 6, //cols: {lg: 12, md: 12, sm: 6, xs: 4, xxs: 2},
            rowHeight: 60,
            draggableHandle: ".react-grid-item-drag-handle, .react-grid-item-drag-handle h4",
            minH: 2
        };
    },
    shouldComponentUpdate(nextProps, nextState) {
    	return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps)
    },
    render() {
    	return (
    		<div>
                <button type="button" onClick={this.handleResetUI}>Reset UI</button>
	            <ReactGridLayout className="layout" layout={this.state.layout} layouts={this.state.layouts} onLayoutChange={this.onLayoutChange} onResizeStop={this.triggerResize} onDragStop={this.triggerResize} {...this.props} >
	                    {this.state.widgets.map(this.getWidget)}
	            </ReactGridLayout>
            </div>
    	);
    }
})

var WidgetWrapper = React.createClass({
    render() {
        var body = this.props.minified ? null : <div className="panel-body panel-body-react-grid">{this.props.children}</div>
        var glyphiconClass = this.props.minified ? "glyphicon glyphicon-plus" : "glyphicon glyphicon-minus";

        return (
            <div className="panel panel-default panel-react-grid">
                <div className="panel-heading react-grid-item-drag-handle">                        
                    <div className="btn-group pull-right">
                        <button className="btn btn-default btn-sm" onClick={this.props.handleMinifyWidget}>
                            <span className={glyphiconClass} aria-hidden="true"></span>
                        </button>
                    </div>
                    <h4>{this.props.title}</h4>
                </div>
                {body}
            </div>    
        )
    }
})