import React, { Component } from "react";
import PropTypes from "prop-types";
import PureRenderMixin from "react-addons-pure-render-mixin";
import _ from "lodash";

export const BootstrapRow = props => {
  const width = props.width || 12;
  const widths = {
    xs: props.xs || width,
    sm: props.sm || props.xs || width,
    md: props.md || props.sm || props.xs || width,
    lg: props.lg || props.md || props.sm || props.xs || width
  };
  const classes = _(widths)
    .mapValues((value, key) => `col-${key}-${value}`)
    .values()
    .join(" ");

  let children;
  if (Array.isArray(props.children)) {
    children = props.children.map((c, i) =>
      <div key={i} className={classes}>
        {c}
      </div>
    );
  } else {
    children = (
      <div className={classes}>
        {props.children}
      </div>
    );
  }
  return (
    <div className="row">
      {children}
    </div>
  );
};
BootstrapRow.propTypes = {
  width: PropTypes.number,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  children: PropTypes.node
};

export const LoadingWrapper = props =>
  <div
    className={`loading-wrapper ${props.loading === true ? " loading" : ""}`}
  >
    <NoDataWrapper {...props} />
  </div>;
LoadingWrapper.propTypes = {
  loading: PropTypes.bool
};

export const NoDataWrapper = props =>
  props.noData === true
    ? <em>No Data</em>
    : <div style={{ height: "100%" }}>
        {props.children}
      </div>;
NoDataWrapper.propTypes = {
  noData: PropTypes.bool,
  children: PropTypes.node
};

export class Checkbox extends Component {
  static propTypes = {
    handleFieldChange: PropTypes.func.isRequired,
    field: PropTypes.object.isRequired,
    selectedField: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(
      this
    );
  }

  handleFieldChange = event =>
    this.props.handleFieldChange(this.props.field, event.target.value);

  render() {
    return (
      <label key={this.props.field.field} className="radio-inline">
        <input
          ref="radioField"
          type="radio"
          checked={this.props.selectedField === this.props.field.field}
          value={this.props.field.field}
          onChange={this.handleFieldChange}
        />
        {this.props.field.name}
      </label>
    );
  }
}
