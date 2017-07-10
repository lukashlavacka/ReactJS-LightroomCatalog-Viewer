import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Bar as BarChart, Pie as PieChart } from "react-chartjs-2";
import squel from "squel";
import q from "q";
import _ from "lodash";
import { LoadingWrapper, Checkbox } from "./shared";
import * as Utilities from "./utilities";
import WorkerWrapper from "./worker-wrapper";

export default class ChartViewer extends PureComponent {
  static propTypes = {
    agragateFields: PropTypes.array,
    worker: PropTypes.instanceOf(WorkerWrapper).isRequired,
    filter: PropTypes.object
  };

  static defaultProps = {
    agragateFields: [
      { field: "camera.value", name: "Camera", type: "pie" },
      { field: "lens.value", name: "Lens", type: "pie" },
      { field: "exif.focalLength", name: "Focal length", type: "bar" },
      { field: "exif.isoSpeedRating", name: "ISO", type: "bar" },
      { field: "exif.aperture", name: "Aperture", type: "bar" },
      { field: "exif.shutterSpeed", name: "Shutter Speed", type: "bar" },
      { field: "images.pick", name: "Flag", type: "pie" },
      { field: "images.colorLabels", name: "Color label", type: "pie" },
      { field: "images.rating", name: "Rating", type: "bar" },
      { field: "keyword.tag", name: "Face", type: "pie" },
      {
        field: 'strftime("%Y", images.captureTime)',
        name: "Year",
        type: "bar"
      },
      {
        field: 'strftime("%Y-%m", images.captureTime)',
        name: "Month",
        type: "bar"
      },
      {
        field: 'strftime("%Y-%W", images.captureTime)',
        name: "Week",
        type: "bar"
      },
      {
        field: 'strftime("%Y-%m-%d", images.captureTime)',
        name: "Day",
        type: "bar"
      }
    ]
  };

  state = {
    field: _.find(this.props.agragateFields, { field: "camera.value" })
  };

  handleFieldChange = field => {
    this.setState({
      field: _.find(this.props.agragateFields, { field: field.field })
    });
  };

  render() {
    let chart;
    if (this.state.field) {
      chart = (
        <Chart
          worker={this.props.worker}
          filter={this.props.filter}
          field={this.state.field}
        />
      );
    }
    return (
      <div>
        <FieldSelector
          agragateFields={this.props.agragateFields}
          field={this.state.field}
          handleFieldChange={this.handleFieldChange}
        />
        {chart}
      </div>
    );
  }
}

const FieldSelector = props =>
  <div>
    <h3>Select agregate field</h3>
    {props.agragateFields.map(f =>
      <Checkbox
        key={f.field}
        handleFieldChange={props.handleFieldChange}
        field={f}
        selectedField={props.field.field}
      />
    )}
  </div>;
FieldSelector.propTypes = {
  agragateFields: PropTypes.array,
  field: PropTypes.object.isRequired,
  handleFieldChange: PropTypes.func.isRequired
};

class Chart extends PureComponent {
  static propTypes = {
    agragateFields: PropTypes.array,
    field: PropTypes.object.isRequired
  };

  state = {
    loading: false,
    data: { columns: [], values: [] }
  };

  componentDidMount() {
    this.getData(this.props)
      .then(this.transformData.bind(this, this.props))
      .then(data => {
        this.setState({
          data,
          loading: false
        });
      })
      .done();
  }

  componentWillReceiveProps(nextProps) {
    const noRedraw = this.props.field.field === nextProps.field.field;
    this.getData(nextProps)
      .then(this.transformData.bind(this, nextProps))
      .then(data => {
        const oldValues = this.state.data.values.map(v => v[0]);
        const newValues = data.values.map(v => v[0]);
        this.setState({
          data,
          loading: false,
          noRedraw: noRedraw && _.isEqual(oldValues, newValues)
        });
      })
      .done();
  }

  getData(properties) {
    this.setState({ loading: true });
    let s = squel
      .select()
      .field(properties.field.field)
      .field('COUNT("images.id_local")')
      .from("Adobe_images", "images")
      .left_join(
        "AgHarvestedExifMetadata",
        "exif",
        "images.id_local = exif.image"
      )
      .left_join(
        "AgLibraryKeywordImage",
        "keyword",
        "images.id_local = keyword.image"
      )
      .left_join(
        "AgInternedExifCameraModel",
        "camera",
        "exif.cameraModelRef = camera.id_local"
      )
      .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local");

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      s = s.where(Utilities.getFilterExpression(key, value));
    });

    s = s.order(properties.field.field).group(properties.field.field);

    const query = s.toString();

    return properties.worker.exec(query);
  }

  transformData(properties, rawData) {
    return q(rawData[0] || { columns: [], values: [] });
  }

  render() {
    let chartElement;
    switch (this.props.field.type) {
      case "pie":
        chartElement = (
          <PieChartComponent
            rawData={this.state.data}
            noRedraw={this.state.noRedraw}
          />
        );
        break;
      default:
      case "bar":
        chartElement = (
          <BarChartComponent
            rawData={this.state.data}
            noRedraw={this.state.noRedraw}
          />
        );
        break;
    }
    return (
      <LoadingWrapper
        loading={this.state.loading}
        noData={!this.state.data.columns.length}
      >
        {chartElement}
      </LoadingWrapper>
    );
  }
}

class BarChartComponent extends PureComponent {
  static propTypes = {
    noRedraw: PropTypes.bool,
    options: PropTypes.object.isRequired,
    rawData: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {
      responsive: true,
      animationEasing: "easeInOutCubic",
      animationSteps: 30
    }
  };

  expandDataset(rawData) {
    const data = {
      labels: rawData.values.map(v => v[0] || "Undefined"),
      datasets: []
    };

    data.datasets.push({
      label: "Count",
      data: rawData.values.map(v => v[1] || "n/a"),
      backgroundColor: rawData.values.map(
        (v, i) => `hsla(${i * (360 / rawData.values.length)},90%,50%,0.5)`
      ),
      hoverBackgroundColor: rawData.values.map(
        (v, i) => `hsla(${i * (360 / rawData.values.length)},90%,50%,0.75)`
      ),
      borderColor: rawData.values.map(
        (v, i) => `hsla(${i * (360 / rawData.values.length)},90%,50%,0.8)`
      ),
      hoverBorderColor: rawData.values.map(
        (v, i) => `hsla(${i * (360 / rawData.values.length)},90%,50%,1.0)`
      )
    });
    return data;
  }

  render() {
    const data = this.expandDataset(this.props.rawData);

    let chart;
    if (this.props.noRedraw) {
      chart = (
        <BarChart data={data} options={this.props.options} ref="pieChart" />
      );
    } else {
      chart = (
        <BarChart
          data={data}
          options={this.props.options}
          ref="pieChart"
          redraw
        />
      );
    }

    return chart;
  }
}

class PieChartComponent extends PureComponent {
  static propTypes = {
    noRedraw: PropTypes.bool,
    options: PropTypes.object.isRequired,
    rawData: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {
      responsive: true,
      animationEasing: "easeInOutCubic",
      animationSteps: 30
    }
  };

  expandDataset(rawData) {
    var sortedRawData = _.sortBy(rawData.values, "v[0]");
    const data = {
      datasets: [
        {
          data: sortedRawData.map((v, i) => v[1]),
          backgroundColor: sortedRawData.map((v, i) => {
            const hue = i * (360 / rawData.values.length);
            return `hsl(${hue},80%,50%)`;
          }),
          hoverBackgroundColor: sortedRawData.map((v, i) => {
            const hue = i * (360 / rawData.values.length);
            return `hsl(${hue},90%,60%)`;
          })
        }
      ],
      labels: sortedRawData.map((v, i) => v[0] || "Undefined")
    };

    return data;
  }

  render() {
    const data = this.expandDataset(this.props.rawData);

    let chart;
    if (this.props.noRedraw) {
      chart = (
        <PieChart data={data} options={this.props.options} ref="pieChart" />
      );
    } else {
      chart = (
        <PieChart
          data={data}
          options={this.props.options}
          ref="pieChart"
          redraw
        />
      );
    }

    return (
      <div>
        {chart}
      </div>
    );
  }
}
