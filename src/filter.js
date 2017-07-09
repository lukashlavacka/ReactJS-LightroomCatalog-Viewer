import React, { Component, PureComponent } from "react";
import PropTypes from "prop-types";
import PureRenderMixin from "react-addons-pure-render-mixin";
import { Checkbox, CheckboxGroup } from "react-checkbox-group";
import DatePicker from "react-datepicker";
import ReactSlider from "react-slider";
import moment from "moment";
import squel from "squel";
import q from "q";
import _ from "lodash";
import { LoadingWrapper } from "./shared";
import WorkerWrapper from "./worker-wrapper";

class FilterFactory extends Component {
  static propTypes = {
    handleFilterChange: PropTypes.func,
    transformName: PropTypes.func,
    worker: PropTypes.instanceOf(WorkerWrapper).isRequired,
    type: PropTypes.string,
    table: PropTypes.string,
    options: PropTypes.array,
    valueProp: PropTypes.string,
    nameProp: PropTypes.string,
    dataFilter: PropTypes.string
  };

  constructor(props) {
    super(props);

    if (this.props.options) {
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.options = this.props.options;
    }
  }

  state = {
    loading: false,
    loaded: false,
    options: [],
    selected: []
  };

  componentDidMount() {
    if (this.props.table) {
      this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then(data => {
          this.setState({
            options: data,
            loading: false
          });
        })
        .done();
    }
  }

  getData(properties) {
    this.setState({ loading: true });
    let s = squel
      .select()
      .field(properties.valueProp || "id_local", "value")
      .field(properties.nameProp || "value", "name")
      .from(properties.table);

    if (properties.dataFilter) {
      s = s.where(properties.dataFilter);
    }

    const query = s.toString();

    return properties.worker.exec(query);
  }

  transformData = (properties, rawData) => {
    const dataset = (rawData && rawData[0]) || { values: [] };
    return q(dataset.values.map(t => ({ value: t[0], name: t[1] })));
  };

  handleChange = newSelected => {
    this.setState({
      selected: newSelected
    });
    this.props.handleFilterChange(this.props.type, newSelected);
  };

  transformName(name) {
    if (_.isFunction(this.props.transformName)) {
      return this.props.transformName(name);
    }
    return name;
  }

  render() {
    return (
      <LoadingWrapper loading={this.state.loading}>
        <form>
          <CheckboxGroup
            name={this.props.type}
            value={this.state.selected}
            onChange={this.handleChange}
          >
            {this.state.options.map(o =>
              <label key={o.value} className="checkbox-inline">
                <Checkbox value={o.value} />
                {this.transformName(o.name)}
              </label>
            )}
          </CheckboxGroup>
        </form>
      </LoadingWrapper>
    );
  }
}

class FilterRangeFactory extends Component {
  static propTypes = {
    field: PropTypes.string,
    type: PropTypes.string,
    handleFilterChange: PropTypes.func,
    transformFromDBValue: PropTypes.func,
    transformToUIName: PropTypes.func,
    transformFromUIValue: PropTypes.func,
    invert: PropTypes.bool,
    minMax: PropTypes.object,
    aditionalType: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(
      this
    );

    if (props.minMax) {
      this.state = {
        dbMin: props.minMax.min,
        dbMax: props.minMax.max,
        dbMinVal: props.minMax.min,
        dbMaxVal: props.minMax.max,
        uiMin: props.invert
          ? this.transformFromDBValue(props, props.minMax.max)
          : this.transformFromDBValue(props, props.minMax.min, true),
        uiMax: props.invert
          ? this.transformFromDBValue(props, props.minMax.min, true)
          : this.transformFromDBValue(props, props.minMax.max)
      };
    }
  }

  state = {
    loading: false
  };

  componentDidMount() {
    if (this.props.field) {
      this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then(data => {
          const minMax = data;
          this.setState({
            loading: false,
            dbMin: minMax.min,
            dbMax: minMax.max,
            dbMinVal: minMax.min,
            dbMaxVal: minMax.max,
            uiMin: this.props.invert
              ? this.transformFromDBValue(this.props, minMax.max)
              : this.transformFromDBValue(this.props, minMax.min, true),
            uiMax: this.props.invert
              ? this.transformFromDBValue(this.props, minMax.min, true)
              : this.transformFromDBValue(this.props, minMax.max)
          });
        })
        .done();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.aditionalType !== nextProps.aditionalType) {
      const uiMin = this.transformFromDBValue(
        nextProps,
        Math.max(this.state.dbMinVal, this.state.dbMin),
        true
      );
      const uiMax = this.transformFromDBValue(
        nextProps,
        Math.min(this.state.dbMaxVal, this.state.dbMax)
      );

      const dbMinVal = this.transformFromUIValue(nextProps, uiMin);
      const dbMaxVal = this.transformFromUIValue(nextProps, uiMax);

      this.setState({
        uiMin,
        uiMax,
        dbMinVal,
        dbMaxVal
      });
      this.props.handleFilterChange(nextProps.type, [dbMinVal, dbMaxVal]);
    }
  }

  getData = props => {
    this.setState({ loading: true });
    const s = squel
      .select()
      .field(`MIN(${props.field})`)
      .field(`MAX(${props.field})`)
      .from("AgHarvestedExifMetadata")
      .where(`${props.field} > 0`);
    const query = s.toString();

    return props.worker.exec(query);
  };

  transformData = (props, rawData) => {
    const values =
      rawData && rawData[0] && rawData[0].values && rawData[0].values[0];

    let minMax = {};
    if (values) {
      minMax = {
        min: values[0],
        max: values[1]
      };
    }
    return q(minMax);
  };

  handleChange = value => {
    const dbVal = value.map(v => this.transformFromUIValue(this.props, v));
    this.setState({
      dbMinVal: dbVal[0],
      dbMaxVal: dbVal[1],
      uiMin: value[0],
      uiMax: value[1]
    });

    if (dbVal[0] <= this.state.dbMin && dbVal[1] >= this.state.dbMax) {
      this.props.handleFilterChange(this.props.type);
    } else {
      this.props.handleFilterChange(this.props.type, dbVal);
    }
  };

  transformFromDBValue = (props, value, isMin) => {
    if (_.isFunction(props.transformFromDBValue)) {
      return props.transformFromDBValue(this.props, value, isMin);
    }
    if (_.isFunction(this.props.transformFromDBValue)) {
      return this.props.transformFromDBValue(this.props, value, isMin);
    }
    return value;
  };

  transformFromUIValue = (props, value) => {
    if (_.isFunction(props.transformFromUIValue)) {
      return props.transformFromUIValue(this.props, value);
    }
    if (_.isFunction(this.props.transformFromUIValue)) {
      return this.props.transformFromUIValue(this.props, value);
    }
    return value;
  };

  transformToUIName = (props, value) => {
    if (_.isFunction(props.transformToUIName)) {
      return props.transformToUIName(props, value);
    }
    if (_.isFunction(this.props.transformFromUIValue)) {
      return this.props.transformFromUIValue(props, value);
    }
    return value;
  };

  render() {
    if (typeof this.state.dbMin === "undefined" || this.state.loading) {
      return <LoadingWrapper loading />;
    }
    if (typeof this.state.dbMin === "undefined") {
      return null;
    }
    if (this.state.dbMin === this.state.dbMax) {
      return (
        <span>
          Only one value available {this.state.dbMin}
        </span>
      );
    }
    return (
      <LoadingWrapper loading={this.state.loading}>
        <ReactSlider
          value={[this.state.uiMin, this.state.uiMax]}
          min={
            this.props.invert
              ? this.transformFromDBValue(this.props, this.state.dbMax)
              : this.transformFromDBValue(this.props, this.state.dbMin, true)
          }
          max={
            this.props.invert
              ? this.transformFromDBValue(this.props, this.state.dbMin, true)
              : this.transformFromDBValue(this.props, this.state.dbMax)
          }
          onChange={this.handleChange}
          pearling
          invert={this.props.invert}
          withBars
        >
          <div>
            {this.transformToUIName(this.props, this.state.uiMin)}
          </div>
          <div>
            {this.transformToUIName(this.props, this.state.uiMax)}
          </div>
        </ReactSlider>
      </LoadingWrapper>
    );
  }
}

export const FilterCamera = props =>
  <FilterFactory type="camera" table="AgInternedExifCameraModel" {...props} />;

export const FilterLens = props =>
  <FilterFactory
    type="lens"
    table="AgInternedExifLens"
    transformName={FilterLens.transformName}
    {...props}
  />;
FilterLens.transformName = function transformName(name) {
  if (name === "DT 0mm F0 SAM") {
    return "Unknown";
  }
  return name;
};

export const FilterFocalLength = props =>
  <FilterRangeFactory
    type="focalLength"
    field="focalLength"
    transformFromDBValue={FilterFocalLength.transformFromDBValue}
    {...props}
  />;
FilterFocalLength.transformFromDBValue = (props, value, isFirst) =>
  isFirst ? Math.floor(value) : Math.ceil(value);

export const FilterISORating = props =>
  <FilterRangeFactory
    type="iso"
    field="isoSpeedRating"
    transformFromDBValue={FilterISORating.transformFromDBValue}
    transformFromUIValue={FilterISORating.transformFromUIValue}
    {...props}
  />;
FilterISORating.transformFromUIValue = (props, value) =>
  Math.pow(2, value) * 100;
FilterISORating.transformFromDBValue = (props, value) =>
  Math.floor(Math.log(value / 100) / Math.log(2));

export class FilterAperture extends Component {
  static defaultProps = {
    types: {
      Full: [0.5, 0.7, 1.0, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32],
      Half: [
        0.7,
        0.8,
        1.0,
        1.2,
        1.4,
        1.7,
        2,
        2.4,
        2.8,
        3.3,
        4,
        4.8,
        5.6,
        6.7,
        8,
        9.5,
        11,
        13,
        16,
        19,
        22,
        27,
        32
      ],
      Third: [
        0.7,
        0.8,
        0.9,
        1.0,
        1.1,
        1.2,
        1.4,
        1.6,
        1.8,
        2,
        2.2,
        2.5,
        2.8,
        3.2,
        3.5,
        4,
        4.5,
        5.0,
        5.6,
        6.3,
        7.1,
        8,
        9,
        10,
        11,
        13,
        14,
        16,
        18,
        20,
        22,
        25,
        29,
        32
      ],
      Continuous: []
    }
  };

  static propTypes = {
    types: PropTypes.object
  };

  state = {
    type: "Continuous"
  };

  transformFromUIValue = (props, value) => {
    if (this.state.type === "Continuous") {
      return value / 10;
    }

    return this.props.types[this.state.type][value];
  };

  transformFromDBValue = (props, value, isFirst) => {
    if (this.state.type === "Continuous") {
      return isFirst ? Math.floor(value * 10) : Math.ceil(value * 10);
    }

    return (
      _.findIndex(this.props.types[this.state.type], v => value < v) -
      (isFirst ? 1 : 0)
    );
  };

  handleChange = event => {
    this.setState({
      type: event.target.value
    });
  };

  render() {
    return (
      <div>
        <FilterRangeFactory
          type="aperture"
          field="aperture"
          transformFromDBValue={this.transformFromDBValue}
          transformFromUIValue={this.transformFromUIValue}
          aditionalType={this.state.type}
          {...this.props}
        />
        {_.keys(this.props.types).map(key =>
          <div key={key} className="radio-inline">
            <label>
              <input
                type="radio"
                checked={this.state.type === key}
                value={key}
                onChange={this.handleChange}
              />
              {key}
            </label>
          </div>
        )}
      </div>
    );
  }
}

export const FilterShutter = props =>
  <FilterRangeFactory
    type="shutter"
    field="shutterSpeed"
    invert
    transformFromDBValue={FilterShutter.transformFromDBValue}
    transformFromUIValue={FilterShutter.transformFromUIValue}
    transformToUIName={FilterShutter.transformToUIName}
    {...props}
  />;
FilterShutter.transformFromUIValue = (props, value) => 100 / value;
FilterShutter.transformFromDBValue = (props, value) => Math.round(100 / value);
FilterShutter.transformToUIName = (props, value) =>
  value > 0 ? `1/${Math.round(value)}` : `${1 / value}s`;

export const FilterFlag = props => <FilterFactory type="flag" {...props} />;
FilterFlag.propTypes = {
  options: PropTypes.array
};
FilterFlag.defaultProps = {
  options: [
    { value: 0, name: "None" },
    { value: -1, name: "Rejected" },
    { value: 1, name: "Selected" }
  ]
};

export const FilterColor = props => <FilterFactory type="color" {...props} />;
FilterColor.propTypes = {
  options: PropTypes.array
};
FilterColor.defaultProps = {
  options: [
    { value: "", name: "None" },
    { value: "Red", name: "Red" },
    { value: "Yellow", name: "Yellow" },
    { value: "Green", name: "Green" },
    { value: "Blue", name: "Blue" },
    { value: "Purple", name: "Purple" }
  ]
};

export const FilterRating = props =>
  <FilterRangeFactory
    type="rating"
    transformToUIName={FilterRating.transformToUIName}
    {...props}
  />;
FilterRating.propTypes = {
  options: PropTypes.array,
  minMax: PropTypes.object
};
FilterRating.defaultProps = {
  options: [
    { value: 0, name: "unrated" },
    { value: 1, name: "1 star" },
    { value: 2, name: "2 star" },
    { value: 3, name: "3 star" },
    { value: 4, name: "4 star" },
    { value: 5, name: "5 star" }
  ],
  minMax: {
    min: 0,
    max: 5
  }
};
FilterRating.transformToUIName = (props, value) =>
  _.find(props.options, { value }).name;

export const FilterFace = props =>
  <FilterFactory
    type="face"
    table="AgLibraryKeyword"
    dataFilter="keywordType = 'person'"
    nameProp="Name"
    {...props}
  />;

export class FilterDate extends Component {
  static propTypes = {
    handleFilterChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(
      this
    );
  }

  state = {
    loading: false,
    min: moment().subtract(1, "month"),
    max: moment().add(1, "month"),
    startDate: moment().subtract(1, "month"),
    endDate: moment().add(1, "month")
  };

  componentDidMount() {
    this.getData(this.props)
      .then(this.transformData.bind(this, this.props))
      .then(data => {
        let momentMin = moment(data.min);
        let momentMax = moment(data.max);
        const moment30past = moment().subtract(30, "years");
        const moment30future = moment().add(30, "years");
        if (momentMin < moment30past) {
          momentMin = moment30past;
        }
        if (momentMax > moment30future) {
          momentMax = moment30future;
        }

        this.setState({
          loading: false,
          min: momentMin.clone().subtract(1, "days"),
          max: momentMax.clone().add(1, "days"),
          startDate: momentMin,
          endDate: momentMax
        });
      })
      .done();
  }

  getData(properties) {
    this.setState({ loading: true });
    const s = squel
      .select()
      .field("MIN(captureTime)")
      .field("MAX(captureTime)")
      .from("Adobe_images");

    const query = s.toString();
    return properties.worker.exec(query);
  }

  transformData = (properties, rawData) => {
    const values =
      rawData && rawData[0] && rawData[0].values && rawData[0].values[0];

    let minMax = {};
    if (values) {
      minMax = {
        min: values[0],
        max: values[1]
      };
    }
    return q(minMax);
  };

  handleStartChange = startDate => {
    this.setState({ startDate });
    this.props.handleFilterChange("date", [startDate, this.state.endDate]);
  };

  handleEndChange = endDate => {
    this.setState({ endDate });
    this.props.handleFilterChange("date", [this.state.startDate, endDate]);
  };

  render() {
    const style = {
      width: "50%",
      float: "left"
    };

    return (
      <LoadingWrapper loading={this.state.loading}>
        <div style={style}>
          <span>From</span>
          <DatePicker
            selected={this.state.startDate}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            onChange={this.handleStartChange}
            minDate={this.state.min}
            maxDate={this.state.max}
          />
        </div>
        <div style={style}>
          <span>To</span>
          <DatePicker
            selected={this.state.endDate}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            onChange={this.handleEndChange}
            minDate={this.state.min}
            maxDate={this.state.max}
          />
        </div>
      </LoadingWrapper>
    );
  }
}
