import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import ReactGridLayoutWithoutProvider, { WidthProvider as widthProvider } from 'react-grid-layout';
import _ from 'lodash';
import * as FilterWidgets from './filter';
import PhotoStats from './stats';
import ChartViewer from './chart';
import TableViewer from './table';
import MapViewer from './map';
import WorkerWrapper from './worker-wrapper';

const ReactGridLayout = widthProvider(ReactGridLayoutWithoutProvider);

export class WindowDimensions extends React.Component {
    static propTypes = {
        handleUpdateDimensions: React.PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

        this.handleUpdateDimensions();
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleUpdateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleUpdateDimensions);
    }

    handleUpdateDimensions() {
        this.props.handleUpdateDimensions({
            width: document.body.clientWidth,
            height: document.body.clientHeight,
        });
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
        cols: React.PropTypes.number.isRequired,
        isLocalFile: React.PropTypes.bool,
    }

    static defaultProps = {
        className: 'layout',
        // breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
        cols: 6, // cols: {lg: 12, md: 12, sm: 6, xs: 4, xxs: 2},
        rowHeight: 60,
        draggableHandle: '.react-grid-item-drag-handle, .react-grid-item-drag-handle h4',
        minH: 2,
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

        const ls = this.props.getLocalStorage();
        this.state = {
            layout: ls.layout || [],
            layouts: ls.layouts || {},
            widgets: [
            /* eslint-disable no-multi-spaces, comma-spacing, max-len, key-spacing */
                { key: 'FilterCamera'       , title: 'Camera'        , filter: 'camera'      , disableLocal: false , grid: { x: 0, y:  1, w: 3, h: 2, minH: 2 } },
                { key: 'FilterLens'         , title: 'Lens'          , filter: 'lens'        , disableLocal: false , grid: { x: 6, y:  1, w: 3, h: 2, minH: 2 } },
                { key: 'FilterFlag'         , title: 'Flag'          , filter: 'flag'        , disableLocal: false , grid: { x: 0, y:  3, w: 3, h: 2, minH: 2 } },
                { key: 'FilterFace'         , title: 'Face'          , filter: 'face'        , disableLocal: false , grid: { x: 6, y:  4, w: 3, h: 2, minH: 2 } },
                { key: 'FilterColor'        , title: 'Color'         , filter: 'color'       , disableLocal: false , grid: { x: 0, y:  4, w: 3, h: 2, minH: 2 } },
                { key: 'FilterFocalLength'  , title: 'Focal Length'  , filter: 'focalLength' , disableLocal: false , grid: { x: 6, y:  4, w: 3, h: 2, minH: 2 } },
                { key: 'FilterISORating'    , title: 'ISO'           , filter: 'iso'         , disableLocal: false , grid: { x: 0, y:  7, w: 3, h: 2, minH: 2 } },
                { key: 'FilterAperture'     , title: 'Aperture'      , filter: 'aperture'    , disableLocal: false , grid: { x: 6, y:  7, w: 3, h: 2, minH: 2 } },
                { key: 'FilterRating'       , title: 'Rating'        , filter: 'rating'      , disableLocal: false , grid: { x: 6, y:  9, w: 3, h: 2, minH: 2 } },
                { key: 'ChartViewer'        , title: 'Chart'         , filter: null          , disableLocal: false , grid: { x: 0, y:  9, w: 3, h: 6, minH: 2 } },
                { key: 'FilterShutter'      , title: 'Shutter Speed' , filter: 'shuter'      , disableLocal: false , grid: { x: 6, y:  9, w: 3, h: 2, minH: 2 } },
                { key: 'FilterDate'         , title: 'Date'          , filter: 'date'        , disableLocal: false , grid: { x: 6, y: 11, w: 3, h: 2, minH: 2 } },
                { key: 'PhotoStats'         , title: 'Most Popular'  , filter: null          , disableLocal: false , grid: { x: 0, y: 13, w: 6, h: 3, minH: 2 } },
                { key: 'TableViewer'        , title: 'Table'         , filter: null          , disableLocal: false , grid: { x: 0, y: 16, w: 6, h: 6, minH: 2 } },
                { key: 'MapViewer'          , title: 'Map'           , filter: null          , disableLocal: true  , grid: { x: 0, y: 22, w: 6, h: 6, minH: 2 } },
            /* eslint-enable */
            ],
        };
    }

    onLayoutChange = (layout, layouts) => {
        this.setState({
            layout,
            layouts,
        });
        this.props.saveLocalStorage('layout', layout);
        this.props.saveLocalStorage('layouts', layouts);
    }

    getWidget = (widget) => {
        const allWidgets = _.extend(
            {},
            FilterWidgets,
            { PhotoStats, ChartViewer, TableViewer, MapViewer }
        );
        const widgetElement = React.createElement(allWidgets[widget.key], this.props);
        const minified = (_.find(this.state.layout, { i: widget.key }) || { }).h === 1;
        return (
            <div key={widget.key} _grid={widget.grid}>
                <WidgetWrapper
                    title={widget.title}
                    minified={minified}
                    widget={widget}
                    handleMinifyWidget={this.handleMinifyWidget}
                >
                    {widgetElement}
                </WidgetWrapper>
            </div>
        );
    }

    handleMinifyWidget = (widget) => {
        const layout = this.state.layout;

        const newLayout = _.cloneDeep(layout);
        const widgetLayoutIndex = _.findIndex(newLayout, { i: widget.key });
        const oldWidgetLayout = layout[widgetLayoutIndex];
        const newMinified = oldWidgetLayout.h > 1;

        let newWidgetLayout;
        if (newMinified) {
            newWidgetLayout = _.extend({}, oldWidgetLayout, {
                h: 1,
                w: 1,
                isResizable: false,
                prevLayout: _.clone(oldWidgetLayout),
            });
        } else {
            newWidgetLayout = oldWidgetLayout.prevLayout;
        }


        newLayout.splice(widgetLayoutIndex, 1, newWidgetLayout);

        this.setState({ layout: newLayout });
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
            layouts: {},
        });
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
                    {...this.props}
                >
                    {
                        this.state.widgets
                            .filter(w => !this.props.isLocalFile || !w.disableLocal)
                            .map(this.getWidget)
                    }
                </ReactGridLayout>
            </div>
        );
    }
}

const WidgetWrapper = (props) => {
    const handleMinifyWidget =
        (e) => props.handleMinifyWidget(props.widget, e.target.value);
    const body = props.minified ?
        null :
        <div className="panel-body panel-body-react-grid">{props.children}</div>;
    const glyphiconClass = props.minified ?
        'glyphicon glyphicon-plus' :
        'glyphicon glyphicon-minus';

    return (
        <div className="panel panel-default panel-react-grid">
            <div className="panel-heading react-grid-item-drag-handle">
                <div className="btn-group pull-right">
                    <button
                        className="btn btn-default btn-sm"
                        onClick={handleMinifyWidget}
                    >
                        <span className={glyphiconClass} aria-hidden="true"></span>
                    </button>
                </div>
                <h4>{props.title}</h4>
            </div>
            {body}
        </div>
    );
};
WidgetWrapper.propTypes = {
    minified: React.PropTypes.bool.isRequired,
    children: React.PropTypes.node,
    handleMinifyWidget: React.PropTypes.func.isRequired,
    title: React.PropTypes.string.isRequired,
    widget: React.PropTypes.object.isRequired,
};
