// @flow
import React, { Component } from "react";
import _ from "lodash";
import { LoadingWrapper } from "./shared";
import { IWorkerWrapper } from "./worker-wrapper";

import type { RawData } from "./types";

export default class DataWidget extends Component {
  props: {
    worker: IWorkerWrapper,
    filter: Object,
    disabled: boolean
  };

  state = {
    loading: false,
    data: []
  };

  componentDidMount() {
    if (this.props.disabled) return;
    this.getData(this.props)
      .then((rawData: RawData) =>
        this.transformDataPromise(this.props, rawData)
      )
      .then(data => {
        this.setState({
          data,
          loading: false
        });
      });
  }

  componentWillReceiveProps(nextProps: typeof DataWidget.prototype.props) {
    if (
      nextProps.disabled ||
      !this.shouldComponentUpdate(nextProps, this.state)
    )
      return;
    this.getData(nextProps)
      .then((rawData: RawData) =>
        this.transformDataPromise(this.props, rawData)
      )
      .then(data => {
        this.setState({
          data,
          loading: false
        });
      });
  }

  shouldComponentUpdate(
    nextProps: typeof DataWidget.prototype.props,
    nextState: typeof DataWidget.prototype.state
  ): boolean {
    return (
      !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
    );
  }

  getData(properties: typeof DataWidget.prototype.props): Promise<any> {
    this.setState({ loading: true });
    const query = this.getQuery(properties);
    return properties.worker.exec(query);
  }

  getQuery(properties: typeof DataWidget.prototype.props): string {
    return "";
  }

  transformData(
    properties: typeof DataWidget.prototype.props,
    rawData: RawData,
    dataset: Array<Array<any>>
  ): Array<any> {
    return dataset;
  }

  transformDataPromise(
    properties: typeof DataWidget.prototype.props,
    rawData: RawData
  ): Promise<Array<any>> {
    const dataset = (rawData && rawData.length && rawData[0].values) || [];
    return Promise.resolve(
      this.transformData(properties, rawData, dataset) || []
    );
  }

  loadingWrapper(content: ?React$Element<any>): ?React$Element<any> {
    return (
      <LoadingWrapper
        loading={this.state.loading}
        noData={!this.state.data.length}
        disabled={this.props.disabled}
      >
        {content}
      </LoadingWrapper>
    );
  }
}
