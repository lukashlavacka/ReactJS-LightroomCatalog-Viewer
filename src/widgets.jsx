import React from 'react';
import ReactGridLayoutWithoutProvider, {WidthProvider} from 'react-grid-layout';
import _ from 'lodash';
import * as FilterWidgets from './filter';
import PhotoStats from './stats';
import ChartViewer from './chart';
import TableViewer from './table';
import WorkerWrapper from './worker-wrapper';

const ReactGridLayout = WidthProvider(ReactGridLayoutWithoutProvider);

export class WindowDimensions extends React.Component {
    static propTypes = {
        handleUpdateDimensions: React.PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);

        this.handleUpdateDimensions();
    }

    handleUpdateDimensions() {
        this.props.handleUpdateDimensions({
            width: document.body.clientWidth,
            height: document.body.clientHeight
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleUpdateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleUpdateDimensions);
    }

    render() {
        return (
            <div></div>
        );
    }
}

export default class WidgetLayout extends React.Component {
    static propTypes = {
        getLocalStorage: React.PropTypes.func.isRequired,
        saveLocalStorage: React.PropTypes.func.isRequired,
        handleFilterChange: React.PropTypes.func.isRequired,
        worker: React.PropTypes.instanceOf(WorkerWrapper).isRequired,
        cols: React.PropTypes.number.isRequired
    }

    constructor(props) {
        super(props);

        const ls = this.props.getLocalStorage();
        this.state = {
            layout: ls.layout || [],
            layouts: ls.layouts || {},
            widgets: [
            /*eslint-disable no-multi-spaces comma-spacing max-len*/
                {key: 'FilterCamera'       , title: 'Camera'        , filter: 'camera'      , grid: {x: 0, y:  1, w: 3, h: 2, minH: 2}},
                {key: 'FilterLens'         , title: 'Lens'          , filter: 'lens'        , grid: {x: 6, y:  1, w: 3, h: 2, minH: 2}},
                {key: 'FilterFlag'         , title: 'Flag'          , filter: 'flag'        , grid: {x: 0, y:  3, w: 3, h: 2, minH: 2}},
                {key: 'FilterFace'         , title: 'Face'          , filter: 'face'        , grid: {x: 6, y:  4, w: 3, h: 2, minH: 2}},
                {key: 'FilterColor'        , title: 'Color'         , filter: 'color'       , grid: {x: 0, y:  4, w: 3, h: 2, minH: 2}},
                {key: 'FilterFocalLength'  , title: 'Focal Length'  , filter: 'focalLength' , grid: {x: 6, y:  4, w: 3, h: 2, minH: 2}},
                {key: 'FilterISORating'    , title: 'ISO'           , filter: 'iso'         , grid: {x: 0, y:  7, w: 3, h: 2, minH: 2}},
                {key: 'FilterAperture'     , title: 'Aperture'      , filter: 'aperture'    , grid: {x: 6, y:  7, w: 3, h: 2, minH: 2}},
                {key: 'FilterRating'       , title: 'Rating'        , filter: 'rating'      , grid: {x: 6, y:  9, w: 3, h: 2, minH: 2}},
                {key: 'ChartViewer'        , title: 'Chart'         , filter: null          , grid: {x: 0, y:  9, w: 3, h: 6, minH: 2}},
                {key: 'FilterShutter'      , title: 'Shutter Speed' , filter: 'shuter'      , grid: {x: 6, y:  9, w: 3, h: 2, minH: 2}},
                {key: 'FilterDate'         , title: 'Date'          , filter: 'date'        , grid: {x: 6, y: 11, w: 3, h: 2, minH: 2}},
                {key: 'PhotoStats'         , title: 'Most Popular'  , filter: null          , grid: {x: 0, y: 13, w: 6, h: 2, minH: 2}},
                {key: 'TableViewer'        , title: 'Table'         , filter: null          , grid: {x: 0, y: 15, w: 6, h: 6, minH: 2}}
            /*eslint-enable*/
            ]
        };
    }

    getWidget = (widget) => {
        const allWidgets = _.extend(
            {},
            FilterWidgets,
            {PhotoStats: PhotoStats, ChartViewer: ChartViewer, TableViewer: TableViewer}
        );
        const widgetElement = React.createElement(allWidgets[widget.key], this.props);
        const minified = (_.find(this.state.layout, {i: widget.key}) || { }).h === 1;
        return (
            <div key={widget.key} _grid={widget.grid}>
                <WidgetWrapper
                    title={widget.title}
                    minified={minified}
                    handleMinifyWidget={this.handleMinifyWidget.bind(this, widget)}>
                    {widgetElement}
                </WidgetWrapper>
            </div>
        );
    }

    onLayoutChange = (layout, layouts) => {
        this.setState({
            layout: layout,
            layouts: layouts
        });
        this.props.saveLocalStorage('layout', layout);
        this.props.saveLocalStorage('layouts', layouts);
    }

    handleMinifyWidget(widget) {
        const layout = this.state.layout;

        const newLayout = _.cloneDeep(layout);
        const widgetLayoutIndex = _.findIndex(newLayout, {i: widget.key});
        const oldWidgetLayout = layout[widgetLayoutIndex];
        const newMinified = oldWidgetLayout.h > 1;

        const minifidWidgetCount = _.filter(layout, {h: 1}).length;

        let newWidgetLayout;
        if (newMinified) {
            newWidgetLayout = _.extend({}, oldWidgetLayout, {
                h: 1,
                w: 1,
                x: minifidWidgetCount % this.props.cols,
                y: Math.floor(minifidWidgetCount / this.props.cols),
                isResizable: false,
                static: true,
                prevLayout: _.clone(oldWidgetLayout)
            });
        } else {
            newWidgetLayout = oldWidgetLayout.prevLayout;
        }

        _.forEach(newLayout, (w) => {
            w.y = w.h > 1 ? 1 : 0;
        });


        newLayout.splice(widgetLayoutIndex, 1, newWidgetLayout);

        this.setState({layout: newLayout});
        this.props.saveLocalStorage('layout', newLayout);
    }

    triggerResize() {
        // required to recalculate the widths of sliders
        window.dispatchEvent(new Event('resize'));
    }

    handleResetUI = () => {
        this.props.saveLocalStorage('layout', []);
        this.props.saveLocalStorage('layouts', {});

        this.setState({
            layout: [],
            layouts: {}
        });
    }

    static defaultProps = {
        className: 'layout',
        // breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
        cols: 6, // cols: {lg: 12, md: 12, sm: 6, xs: 4, xxs: 2},
        rowHeight: 60,
        draggableHandle: '.react-grid-item-drag-handle, .react-grid-item-drag-handle h4',
        minH: 2
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        return (
            <div>
                <button type="button" onClick={this.handleResetUI}>Reset UI</button>
                <ReactGridLayout
                    className="layout"
                    layout={this.state.layout}
                    layouts={this.state.layouts}
                    onLayoutChange={this.onLayoutChange}
                    onResizeStop={this.triggerResize}
                    onDragStop={this.triggerResize}
                    {...this.props}>
                        {this.state.widgets.map(this.getWidget)}
                </ReactGridLayout>
            </div>
        );
    }
}

class WidgetWrapper extends React.Component {
    static propTypes = {
        minified: React.PropTypes.bool.isRequired,
        children: React.PropTypes.oneOfType([
            React.PropTypes.object,
            React.PropTypes.array
        ]),
        handleMinifyWidget: React.PropTypes.func.isRequired,
        title: React.PropTypes.string.isRequired
    }

    render() {
        const body = this.props.minified ?
            null :
            <div className="panel-body panel-body-react-grid">{this.props.children}</div>;
        const glyphiconClass = this.props.minified ?
            'glyphicon glyphicon-plus' :
            'glyphicon glyphicon-minus';

        return (
            <div className="panel panel-default panel-react-grid">
                <div className="panel-heading react-grid-item-drag-handle">
                    <div className="btn-group pull-right">
                        <button
                            className="btn btn-default btn-sm"
                            onClick={this.props.handleMinifyWidget}>
                            <span className={glyphiconClass} aria-hidden="true"></span>
                        </button>
                    </div>
                    <h4>{this.props.title}</h4>
                </div>
                {body}
            </div>
        );
    }
}
