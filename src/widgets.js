import React, { PureComponent, Component } from "react";
import PropTypes from "prop-types";
import ReactGridLayoutWithoutProvider, {
  WidthProvider as widthProvider
} from "react-grid-layout";
import _ from "lodash";
import * as FilterWidgets from "./widgets/filter";
import PhotoStats from "./widgets/stats";
import ChartViewer from "./widgets/chart";
import TableViewer from "./widgets/table";
import MapViewer from "./widgets/map";
import Recommendation from "./widgets/recommendation";
import { IWorkerWrapper } from "./common/worker-wrapper";

import "react-grid-layout/css/styles.css";
import "./widgets.css";

const ReactGridLayout = widthProvider(ReactGridLayoutWithoutProvider);

export class WindowDimensions extends PureComponent {
  props: {
    handleUpdateDimensions: ({ width: number, height: number }) => void
  };

  constructor(props) {
    super(props);

    this.handleUpdateDimensions();
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleUpdateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleUpdateDimensions);
  }

  handleUpdateDimensions() {
    this.props.handleUpdateDimensions({
      width: document.body.clientWidth,
      height: document.body.clientHeight
    });
  }

  render() {
    return <div />;
  }
}

export default class WidgetLayout extends Component {
  props: {
    getLocalStorage: () => object,
    saveLocalStorage: (identifier: string, state: any) => void,
    handleFilterChange: (identifier: string, state: any) => void,
    worker: IWorkerWrapper,
    cols: number,
    isLocalFile: boolean
  };

  static defaultProps = {
    className: "layout",
    // breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
    cols: 6, // cols: {lg: 12, md: 12, sm: 6, xs: 4, xxs: 2},
    rowHeight: 60,
    draggableHandle:
      ".react-grid-item-drag-handle, .react-grid-item-drag-handle h4",
    minH: 2
  };

  shouldComponentUpdate(nextProps: object, nextState: object) {
    return (
      !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
    );
  }

  constructor(props: object) {
    super(props);

    const ls = this.props.getLocalStorage();
    this.state = {
      layout: ls.layout || [],
      layouts: ls.layouts || {},
      widgets: [
        {
          key: "FilterCamera",
          title: "Camera",
          filter: "camera",
          disableLocal: false,
          grid: { x: 0, y: 1, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterLens",
          title: "Lens",
          filter: "lens",
          disableLocal: false,
          grid: { x: 6, y: 1, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterFlag",
          title: "Flag",
          filter: "flag",
          disableLocal: false,
          grid: { x: 0, y: 3, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterFace",
          title: "Face",
          filter: "face",
          disableLocal: false,
          grid: { x: 6, y: 4, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterColor",
          title: "Color",
          filter: "color",
          disableLocal: false,
          grid: { x: 0, y: 4, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterFocalLength",
          title: "Focal Length",
          filter: "focalLength",
          disableLocal: false,
          grid: { x: 6, y: 4, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterISORating",
          title: "ISO",
          filter: "iso",
          disableLocal: false,
          grid: { x: 0, y: 7, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterAperture",
          title: "Aperture",
          filter: "aperture",
          disableLocal: false,
          grid: { x: 6, y: 7, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterRating",
          title: "Rating",
          filter: "rating",
          disableLocal: false,
          grid: { x: 6, y: 9, w: 3, h: 2, minH: 2 }
        },
        {
          key: "ChartViewer",
          title: "Chart",
          filter: null,
          disableLocal: false,
          grid: { x: 0, y: 9, w: 3, h: 6, minH: 2 }
        },
        {
          key: "FilterShutter",
          title: "Shutter Speed",
          filter: "shuter",
          disableLocal: false,
          grid: { x: 6, y: 9, w: 3, h: 2, minH: 2 }
        },
        {
          key: "FilterDate",
          title: "Date",
          filter: "date",
          disableLocal: false,
          grid: { x: 6, y: 11, w: 3, h: 2, minH: 2 }
        },
        {
          key: "PhotoStats",
          title: "Most Popular",
          filter: null,
          disableLocal: false,
          grid: { x: 0, y: 13, w: 6, h: 3, minH: 2 }
        },
        {
          key: "TableViewer",
          title: "Table",
          filter: null,
          disableLocal: false,
          grid: { x: 0, y: 16, w: 6, h: 6, minH: 2 }
        },
        {
          key: "Recommendation",
          title: "Recommendations",
          filter: null,
          disableLocal: false,
          grid: { x: 0, y: 22, w: 6, h: 3, minH: 2 }
        },
        {
          key: "MapViewer",
          title: "Map",
          filter: null,
          disableLocal: true,
          grid: { x: 0, y: 25, w: 6, h: 6, minH: 2 }
        }
      ],
      prevLayout: ls.prevLayout || {}
    };
  }

  onLayoutChange = (layout, layouts) => {
    this.setState({
      layout,
      layouts
    });
    this.props.saveLocalStorage("layout", layout);
    this.props.saveLocalStorage("layouts", layouts);
  };

  getWidget = widget => {
    const allWidgets = _.extend({}, FilterWidgets, {
      PhotoStats,
      ChartViewer,
      TableViewer,
      MapViewer,
      Recommendation
    });

    // if widget is filter we don't need to pass filter
    let widgetElement;
    if (widget.filter) {
      const { filter, ...passProps } = this.props;
      widgetElement = React.createElement(allWidgets[widget.key], passProps);
    } else {
      widgetElement = React.createElement(allWidgets[widget.key], this.props);
    }
    const minified =
      (_.find(this.state.layout, { i: widget.key }) || {}).h === 1;
    return (
      <div key={widget.key} data-grid={widget.grid}>
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
  };

  handleMinifyWidget = widget => {
    const layout = this.state.layout;
    const prevLayout = this.state.prevLayout;

    const newLayout = _.cloneDeep(layout);
    const newPrevLayout = _.cloneDeep(prevLayout);

    const widgetLayoutIndex = _.findIndex(newLayout, { i: widget.key });
    const oldWidgetLayout = layout[widgetLayoutIndex];
    const newMinified = oldWidgetLayout.h > 1;

    let newWidgetLayout;
    if (newMinified) {
      newWidgetLayout = _.extend({}, oldWidgetLayout, {
        h: 1,
        w: 1,
        isResizable: false
      });
      newPrevLayout[widget.key] = _.clone(oldWidgetLayout);
    } else {
      newWidgetLayout = prevLayout[widget.key] || {};
      newPrevLayout[widget.key] = null;
    }

    newLayout.splice(widgetLayoutIndex, 1, newWidgetLayout);

    this.setState({ layout: newLayout, prevLayout: newPrevLayout });
    this.props.saveLocalStorage("layout", newLayout);
    this.props.saveLocalStorage("prevLayout", newPrevLayout);
  };

  triggerResize() {
    // required to recalculate the widths of sliders
    window.dispatchEvent(new Event("resize"));
  }

  handleResetUI = () => {
    this.props.saveLocalStorage("layout", []);
    this.props.saveLocalStorage("layouts", {});
    this.props.saveLocalStorage("prevLayout", {});

    this.setState({
      layout: [],
      layouts: {},
      prevLayout: {}
    });
  };

  render() {
    return (
      <div>
        <button type="button" className="btn" onClick={this.handleResetUI}>
          Reset UI
        </button>
        <ReactGridLayout
          className="layout"
          layout={this.state.layout}
          layouts={this.state.layouts}
          onLayoutChange={this.onLayoutChange}
          onResizeStop={this.triggerResize}
          onDragStop={this.triggerResize}
          {...this.props}
        >
          {this.state.widgets
            .filter(w => !this.props.isLocalFile || !w.disableLocal)
            .map(this.getWidget)}
        </ReactGridLayout>
      </div>
    );
  }
}

const WidgetWrapper = props => {
  const handleMinifyWidget = e =>
    props.handleMinifyWidget(props.widget, e.target.value);
  const body = props.minified
    ? null
    : <div className="card-block card-body-react-grid">
        {props.children}
      </div>;
  const glyphiconClass = props.minified ? "plus-square-o" : "minus-square-o";

  return (
    <div className="card react-grid-item">
      <div className="card-header react-grid-item-drag-handle">
        <button
          className="btn btn-link btn-lg float-right card-btn-minify"
          onClick={handleMinifyWidget}
        >
          <i className={`fa fa-lg fa-${glyphiconClass}`} aria-hidden="true" />
        </button>
        <h4>
          {props.title}
        </h4>
      </div>
      {body}
    </div>
  );
};
WidgetWrapper.propTypes = {
  minified: PropTypes.bool.isRequired,
  children: PropTypes.node,
  handleMinifyWidget: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  widget: PropTypes.object.isRequired
};
