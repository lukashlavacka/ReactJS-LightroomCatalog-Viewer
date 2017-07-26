// @flow
import React, { PureComponent } from "react";
import _ from "lodash";

import "./shared.css";

export const BootstrapRow = (props: {
  width: number,
  xs: number,
  sm: number,
  md: number,
  lg: number,
  children: ?React$Element<any>
}): ?React$Element<any> => {
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

export const DisabledWrapper = (props: {
  disabled: boolean,
  children?: ?React$Element<any>
}): ?React$Element<any> =>
  <div
    className={`disabled-wrapper ${props.disabled === true ? "disabled" : ""}`}
  >
    <div className="disabled-wrapper-overlay" />
    {props.children}
  </div>;

export const LoadingWrapper = (props: {
  loading: boolean
}): ?React$Element<any> =>
  <div className={`loading-wrapper ${props.loading === true ? "loading" : ""}`}>
    <NoDataWrapper {...props} />
  </div>;

export const NoDataWrapper = (props: {
  noData?: boolean,
  children?: ?React$Element<any>
}): ?React$Element<any> =>
  props.noData === true && props.loading === false
    ? <em>No Data</em>
    : <div style={{ height: "100%" }}>
        {props.children}
      </div>;

export class Radio extends PureComponent {
  props: {
    handleFieldChange: (
      field: { field: string, name: string },
      value: string
    ) => void,
    field: { field: string, name: string },
    selectedField: string,
    disabled?: boolean
  };

  handleFieldChange = (event: Event & { target: HTMLInputElement }) =>
    this.props.handleFieldChange(this.props.field, event.target.value);

  render() {
    return (
      <label
        key={this.props.field.field}
        className="custom-control custom-radio"
      >
        <input
          ref="radioField"
          type="radio"
          className="custom-control-input"
          disabled={this.props.disabled}
          checked={this.props.selectedField === this.props.field.field}
          value={this.props.field.field}
          onChange={this.handleFieldChange}
        />
        <span className="custom-control-indicator" />
        <span className="custom-control-description">
          {this.props.field.name}
        </span>
      </label>
    );
  }
}
