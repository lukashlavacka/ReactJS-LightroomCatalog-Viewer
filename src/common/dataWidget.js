// @flow
import React, { PureComponent } from "react";
import { LoadingWrapper } from "./shared";
import { IWorkerWrapper } from "./worker-wrapper";

import type { RawData } from "./types";

export default class DataWidget extends PureComponent {
  props: {
    worker: IWorkerWrapper,
    filter: Object
  };

  state = {
    loading: false,
    data: []
  };

  componentDidMount() {
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
      >
        {content}
      </LoadingWrapper>
    );
  }
}
