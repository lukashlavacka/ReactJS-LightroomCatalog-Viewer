// @flow
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Checkbox, CheckboxGroup } from "react-checkbox-group";
import DatePicker from "react-datepicker";
import ReactSlider from "react-slider";
import moment from "moment";
import squel from "squel";
import _ from "lodash";
import { LoadingWrapper } from "../common/shared";
import type { IWorkerWrapper } from "../common/worker-wrapper";
import type { RawData } from "../common/types";

import "react-datepicker/dist/react-datepicker.css";
import "./filter.css";

class FilterFactory extends PureComponent {
  props: {
    handleFilterChange: (type: string, value: ?Array<any>) => void,
    transformName: (type: string, value: ?Array<any>) => string,
    worker: IWorkerWrapper,
    type: string,
    table: string,
    options: Array<{ value: number, name: string }>,
    valueProp: string,
    nameProp: string,
    dataFilter: string,
    disabled: boolean
  };

  state = {
    loading: false,
    loaded: false,
    options: ([]: Array<{ value: number, name: string }>),
    selected: []
  };

  componentDidMount() {
    if (this.props.table) {
      this.getData(this.props)
        .then((rawData: RawData) => this.transformData(this.props, rawData))
        .then(data => {
          this.setState({
            options: data,
            loading: false
          });
        });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.disabled !== prevProps.disabled) {
      if (this.props.disabled) {
        this.props.handleFilterChange(this.props.type, undefined);
      } else {
        const newSelectedFilter = this.state.selected.length
          ? this.state.selected
          : undefined;
        this.props.handleFilterChange(this.props.type, newSelectedFilter);
      }
    }
  }

  getData(props: typeof FilterFactory.prototype.props): Promise<RawData> {
    this.setState({ loading: true });
    let s = squel
      .select()
      .field(props.valueProp || "id_local", "value")
      .field(props.nameProp || "value", "name")
      .from(props.table);

    if (props.dataFilter) {
      s = s.where(props.dataFilter);
    }

    const query = s.toString();

    return props.worker.exec(query);
  }

  transformData = (
    properties: typeof FilterFactory.prototype.props,
    rawData: RawData
  ) => {
    const dataset = (rawData && rawData[0] && rawData[0].values) || [];
    return Promise.resolve(dataset.map(t => ({ value: t[0], name: t[1] })));
  };

  handleChange = (newSelected: Array<string>): void => {
    const newSelectedFilter = newSelected.length ? newSelected : undefined;
    this.setState({
      selected: newSelected
    });
    this.props.handleFilterChange(this.props.type, newSelectedFilter);
  };

  transformName(name: string): string {
    if (this.props.transformName) {
      return this.props.transformName(name);
    }
    return name;
  }

  render() {
    return (
      <LoadingWrapper
        loading={this.state.loading}
        disabled={this.props.disabled}
      >
        <form>
          <CheckboxGroup
            name={this.props.type}
            value={this.state.selected}
            onChange={this.handleChange}
          >
            {(this.props.options || this.state.options).map(o =>
              <label key={o.value} className="custom-control custom-checkbox">
                <Checkbox value={o.value} className="custom-control-input" />
                <span className="custom-control-indicator" />
                <span className="custom-control-description">
                  {this.transformName(o.name)}
                </span>
              </label>
            )}
          </CheckboxGroup>
        </form>
      </LoadingWrapper>
    );
  }
}

class FilterRangeFactory extends PureComponent {
  props: {
    field: string,
    type: string,
    handleFilterChange: (type: string, value: ?Array<any>) => void,
    transformFromDBValue?: (
      props: typeof FilterRangeFactory.prototype.props,
      value: number,
      isMin?: boolean
    ) => number,
    transformFromUIValue?: (
      props: typeof FilterRangeFactory.prototype.props,
      value: number
    ) => number,
    transformToUIName?: (
      props: typeof FilterRangeFactory.prototype.props,
      value: number
    ) => string,
    invert?: boolean,
    minMax?: { min: number, max: number },
    aditionalType?: string,
    worker: IWorkerWrapper,
    disabled: boolean
  };

  constructor(props: typeof FilterRangeFactory.prototype.props) {
    super(props);

    const minMax = props.minMax;
    if (minMax) {
      this.state = {
        loading: false,
        dbMin: minMax.min,
        dbMax: minMax.max,
        dbMinVal: minMax.min,
        dbMaxVal: minMax.max,
        uiMin: this.transformFromDBValue(props, minMax.min, true),
        uiMax: this.transformFromDBValue(props, minMax.max)
      };
    }
  }

  state = {
    loading: true,
    dbMin: 0,
    dbMax: 1,
    dbMinVal: 0,
    dbMaxVal: 1,
    uiMin: 0,
    uiMax: 1
  };

  componentDidMount() {
    if (this.props.field) {
      this.getData(this.props)
        .then((rawData: RawData) => this.transformData(this.props, rawData))
        .then(data => {
          if (data && data.min && data.max) {
            const minMax = data;
            this.setState({
              loading: false,
              dbMin: minMax.min,
              dbMax: minMax.max,
              dbMinVal: minMax.min,
              dbMaxVal: minMax.max,
              uiMin: this.transformFromDBValue(this.props, minMax.min, true),
              uiMax: this.transformFromDBValue(this.props, minMax.max)
            });
          }
        });
    }
  }

  componentWillReceiveProps(
    nextProps: typeof FilterRangeFactory.prototype.props
  ) {
    if (this.props.aditionalType !== nextProps.aditionalType) {
      const uiMin = this.transformFromDBValue(
        nextProps,
        Math.min(this.state.dbMinVal, this.state.dbMin),
        true
      );
      const uiMax = this.transformFromDBValue(
        nextProps,
        Math.max(this.state.dbMaxVal, this.state.dbMax)
      );

      const dbMinVal = Math.max(this.state.dbMinVal, this.state.dbMin);
      const dbMaxVal = Math.min(this.state.dbMaxVal, this.state.dbMax);

      this.setState({
        uiMin,
        uiMax,
        dbMinVal,
        dbMaxVal
      });

      this.props.handleFilterChange(nextProps.type, [dbMinVal, dbMaxVal]);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.disabled !== prevProps.disabled) {
      if (this.props.disabled) {
        this.props.handleFilterChange(this.props.type, undefined);
      } else {
        this.handleChange([this.state.uiMin, this.state.uiMax]);
      }
    }
  }

  getData = (
    props: typeof FilterRangeFactory.prototype.props
  ): Promise<RawData> => {
    this.setState({ loading: true });
    const s = squel
      .select()
      .field(`MIN(${props.field})`)
      .field(`MAX(${props.field})`)
      .from("AgHarvestedExifMetadata")
      .where(`${props.field} IS NOT NULL`);
    const query = s.toString();

    return props.worker.exec(query);
  };

  transformData = (
    props: typeof FilterRangeFactory.prototype.props,
    rawData: RawData
  ): Promise<{ min: number, max: number } | null> => {
    const values =
      rawData && rawData[0] && rawData[0].values && rawData[0].values[0];

    let minMax = null;
    if (values) {
      minMax = {
        min: parseFloat(values[0]),
        max: parseFloat(values[1])
      };
    }
    return Promise.resolve(minMax);
  };

  handleChange = (value: Array<number>) => {
    const dbVal = value.map(v => this.transformFromUIValue(this.props, v));
    const newSelectedFilter = dbVal.length ? dbVal : undefined;
    this.setState({
      dbMinVal: dbVal[0],
      dbMaxVal: dbVal[1],
      uiMin: value[0],
      uiMax: value[1]
    });

    if (dbVal[0] <= this.state.dbMin && dbVal[1] >= this.state.dbMax) {
      this.props.handleFilterChange(this.props.type, undefined);
    } else {
      this.props.handleFilterChange(this.props.type, newSelectedFilter);
    }
  };

  transformFromDBValue = (props, value, isMin): number => {
    if (props.transformFromDBValue) {
      return props.transformFromDBValue(this.props, value, isMin);
    }
    if (this.props.transformFromDBValue) {
      return this.props.transformFromDBValue(this.props, value, isMin);
    }
    return value;
  };

  transformFromUIValue = (props, value: number): number => {
    if (props.transformFromUIValue) {
      return props.transformFromUIValue(this.props, value);
    }
    if (this.props.transformFromUIValue) {
      return this.props.transformFromUIValue(this.props, value);
    }
    return parseFloat(value);
  };

  transformToUIName = (
    props: typeof FilterRangeFactory.prototype.props,
    value: number
  ): string => {
    if (props.transformToUIName) {
      return props.transformToUIName(props, value);
    }
    if (this.props.transformToUIName) {
      return this.props.transformToUIName(props, value);
    }
    return value.toString();
  };

  render() {
    if (typeof this.state.dbMin === "undefined" || this.state.loading) {
      return <LoadingWrapper loading disabled={this.props.disabled} />;
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
      <LoadingWrapper
        loading={this.state.loading}
        disabled={this.props.disabled}
      >
        <ReactSlider
          value={[this.state.uiMin, this.state.uiMax]}
          min={this.transformFromDBValue(this.props, this.state.dbMin, true)}
          max={this.transformFromDBValue(this.props, this.state.dbMax)}
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

export const FilterCamera = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory type="camera" table="AgInternedExifCameraModel" {...props} />;

export const FilterLens = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory type="lens" table="AgInternedExifLens" {...props} />;

export const FilterFocalLength = (
  props: typeof FilterRangeFactory.prototype.props
) =>
  <FilterRangeFactory
    type="focalLength"
    field="focalLength"
    transformFromDBValue={FilterFocalLength.transformFromDBValue}
    {...props}
  />;
FilterFocalLength.transformFromDBValue = (
  props: typeof FilterRangeFactory.prototype.props,
  value: number,
  isFirst?: boolean
): number => (isFirst ? Math.floor(value) : Math.ceil(value));

export const FilterISORating = (
  props: typeof FilterRangeFactory.prototype.props
) =>
  <FilterRangeFactory
    type="iso"
    field="isoSpeedRating"
    transformFromDBValue={FilterISORating.transformFromDBValue}
    transformFromUIValue={FilterISORating.transformFromUIValue}
    transformToUIName={FilterISORating.transformToUIName}
    {...props}
  />;
FilterISORating.transformFromUIValue = (props, value) =>
  Math.pow(2, value) * 100;
FilterISORating.transformFromDBValue = (props, value) =>
  Math.floor(Math.log(value / 100) / Math.log(2));
FilterISORating.transformToUIName = (props, value) =>
  (Math.pow(2, value) * 100).toString();

export class FilterAperture extends PureComponent {
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
  props: {
    types: {
      [type: string]: Array<number>
    },
    handleFilterChange: (type: string, value: ?Array<any>) => void,
    worker: IWorkerWrapper,
    disabled: boolean
  };

  state = {
    type: "Continuous"
  };

  transformFromUIValue = (
    props: typeof FilterRangeFactory.prototype.props,
    value: number
  ): number => {
    if (this.state.type === "Continuous") {
      return value / 10;
    }

    return this.props.types[this.state.type][value];
  };

  transformFromDBValue = (
    props: typeof FilterRangeFactory.prototype.props,
    value: number,
    isFirst?: boolean
  ) => {
    if (this.state.type === "Continuous") {
      return isFirst ? Math.floor(value * 10) : Math.ceil(value * 10);
    }

    return (
      _.findIndex(this.props.types[this.state.type], v => value < v) -
      (isFirst ? 1 : 0)
    );
  };

  transformToUIName = (
    props: typeof FilterRangeFactory.prototype.props,
    value: number
  ) => {
    if (this.state.type === "Continuous") {
      return `f/${value / 10}`;
    }
    return `f/${this.props.types[this.state.type][value]}`;
  };

  handleChange = (event: Event & { target: HTMLInputElement }) => {
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
          transformToUIName={this.transformToUIName}
          aditionalType={this.state.type}
          {...this.props}
        />
        {_.keys(this.props.types).map(key =>
          <label key={key} className="custom-control custom-radio">
            <input
              type="radio"
              className="custom-control-input"
              checked={this.state.type === key}
              value={key}
              onChange={this.handleChange}
            />
            <span className="custom-control-indicator" />
            <span className="custom-control-description">
              {key}
            </span>
          </label>
        )}
      </div>
    );
  }
}

export const FilterShutter = (
  props: typeof FilterRangeFactory.prototype.props
) =>
  <FilterRangeFactory
    type="shutter"
    field="shutterSpeed"
    transformToUIName={FilterShutter.transformToUIName}
    transformFromDBValue={FilterShutter.transformFromDBValue}
    invert={true}
    {...props}
  />;
FilterShutter.transformFromDBValue = (props, value, isFirst) =>
  isFirst ? Math.floor(value) : Math.ceil(value);
FilterShutter.transformToUIName = (props, value) =>
  value > 1
    ? `1/${Math.round(Math.pow(2, value))}s`
    : `${Math.round(10 / Math.pow(2, value)) / 10}s`;

export const FilterFlag = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory type="flag" {...props} />;
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

export const FilterColor = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory type="color" {...props} />;
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

export const FilterRating = (props: typeof FilterRangeFactory.defaultProps) =>
  <FilterRangeFactory
    type="rating"
    transformToUIName={FilterRating.transformToUIName}
    {...props}
  />;
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

export const FilterFace = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory
    type="face"
    table="AgLibraryKeyword"
    dataFilter="keywordType = 'person'"
    nameProp="Name"
    {...props}
  />;

export const FilterTag = (props: typeof FilterFactory.prototype.props) =>
  <FilterFactory
    type="tag"
    table="AgLibraryKeyword"
    dataFilter="name IS NOT NULL AND keywordType IS NULL"
    nameProp="Name"
    {...props}
  />;

export class FilterDate extends PureComponent {
  props: {
    handleFilterChange: (type: string, value: ?Array<any>) => void,
    worker: IWorkerWrapper,
    disabled: boolean
  };

  state = {
    loading: false,
    min: moment().subtract(1, "month"),
    max: moment().add(1, "month"),
    startDate: moment().subtract(1, "month"),
    endDate: moment().add(1, "month")
  };

  componentDidMount() {
    this.getData(this.props)
      .then((rawData: RawData) => this.transformData(this.props, rawData))
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
      });
  }

  getData(properties: typeof FilterDate.prototype.props): Promise<RawData> {
    this.setState({ loading: true });
    const s = squel
      .select()
      .field("MIN(captureTime)")
      .field("MAX(captureTime)")
      .from("Adobe_images");

    const query = s.toString();
    return properties.worker.exec(query);
  }

  transformData = (
    properties: typeof FilterDate.prototype.props,
    rawData: RawData
  ) => {
    const values =
      rawData && rawData[0] && rawData[0].values && rawData[0].values[0];

    let minMax = {};
    if (values) {
      minMax = {
        min: values[0],
        max: values[1]
      };
    }
    return Promise.resolve(minMax);
  };

  handleStartChange = (startDate: moment) => {
    this.setState({ startDate });
    this.props.handleFilterChange("date", [startDate, this.state.endDate]);
  };

  handleEndChange = (endDate: moment) => {
    this.setState({ endDate });
    this.props.handleFilterChange("date", [this.state.startDate, endDate]);
  };

  render() {
    const style = {
      width: "50%",
      float: "left"
    };

    return (
      <LoadingWrapper
        loading={this.state.loading}
        disabled={this.props.disabled}
      >
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
