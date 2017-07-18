import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { BootstrapRow, Radio } from "../common/shared";
import * as Utilities from "../common/utilities";
import WorkerWrapper from "../common/worker-wrapper";
import DataWidget from "../common/dataWidget";

export default class TableViewer extends PureComponent {
  static propTypes = {
    worker: PropTypes.instanceOf(WorkerWrapper).isRequired,
    filter: PropTypes.object
  };

  state = {
    xField: "exif.isoSpeedRating",
    yField: "images.rating"
  };

  handleXFieldChange = field => {
    this.setState({ xField: field.field });
  };

  handleYFieldChange = field => {
    this.setState({ yField: field.field });
  };

  render() {
    let table;
    if (this.state.xField && this.state.yField) {
      table = (
        <Table
          worker={this.props.worker}
          filter={this.props.filter}
          xField={this.state.xField}
          yField={this.state.yField}
        />
      );
    }
    return (
      <div>
        <FieldSelector
          field={this.state.xField}
          name="x agregate field"
          otherField={this.state.yField}
          handleFieldChange={this.handleXFieldChange}
        />
        <FieldSelector
          field={this.state.yField}
          name="y agregate field"
          otherField={this.state.xField}
          handleFieldChange={this.handleYFieldChange}
        />
        {table}
      </div>
    );
  }
}

const FieldSelector = function FieldSelector(props) {
  return (
    <BootstrapRow>
      <div>
        <h3>
          Select {props.name}
        </h3>
        {Utilities.aggregateFields.map(f =>
          <Radio
            key={f.field}
            disabled={f.field === props.otherField}
            handleFieldChange={props.handleFieldChange}
            field={f}
            selectedField={props.field}
          />
        )}
      </div>
    </BootstrapRow>
  );
};
FieldSelector.propTypes = {
  handleFieldChange: PropTypes.func.isRequired,
  field: PropTypes.string,
  otherField: PropTypes.string,
  name: PropTypes.string
};

class Table extends DataWidget {
  static propTypes = {
    ...DataWidget.propTypes,
    xField: PropTypes.string,
    yField: PropTypes.string
  };

  getQuery(properties) {
    let s = Utilities.dbSquelFrom()
      .field(properties.xField)
      .field(properties.yField)
      .field("COUNT(images.id_local)")
      .field("AVG(IFNULL(images.rating, 0))")
      .where(`${properties.xField} IS NOT NULL`)
      .where(`${properties.yField} IS NOT NULL`);

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      s = s.where(Utilities.getFilterExpression(key, value));
    });

    s = s
      .order(properties.xField)
      .order(properties.yField)
      .group(properties.xField)
      .group(properties.yField);

    return s.toString();
  }

  render() {
    return this.loadingWrapper(
      <TableComponent
        data={this.state.data}
        xField={this.props.xField}
        yField={this.props.yField}
      />
    );
  }
}

const TableComponent = props => {
  if (!props.data) {
    return <noscript />;
  }
  const transformedData = TableComponent.transformData(props);
  const xFieldObj = _.find(Utilities.aggregateFields, { field: props.xField });
  const yFieldObj = _.find(Utilities.aggregateFields, { field: props.yField });
  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover table-col-hover table-bordered no-bottom-margin">
        <thead>
          <tr>
            <th />
            {transformedData.uniqueX.map(xVal =>
              <th key={xVal}>
                {Utilities.formatDbValue(xFieldObj.type, xVal)}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transformedData.uniqueY.map(yVal =>
            <tr key={yVal}>
              <th>
                {Utilities.formatDbValue(yFieldObj.type, yVal)}
              </th>
              {transformedData.uniqueX.map(xVal => {
                const val = TableComponent.findByXY(
                  props,
                  xVal,
                  yVal,
                  transformedData.maxCount,
                  transformedData.maxAverage
                );
                const style = {
                  backgroundColor: `hsla(0,0%,${Math.round(
                    val.relCount * 100
                  )}%,0.05)`
                };
                return (
                  <td key={`${yVal}_${xVal}`} style={style} title={val.rating}>
                    {val.count}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
TableComponent.propTypes = {
  data: PropTypes.array,
  xField: PropTypes.string,
  yField: PropTypes.string
};
TableComponent.transformData = props => {
  const uniqueX = _(props.data)
    .map(r => r[0])
    .uniq()
    .value()
    .sort(TableComponent.correctSort(props.xField));

  const uniqueY = _(props.data)
    .map(r => r[1])
    .uniq()
    .value()
    .sort(TableComponent.correctSort(props.yField));

  const maxCount = _(props.data).map(r => r[2]).max();

  const maxAverage = _(props.data).map(r => r[3]).max();

  return {
    uniqueX,
    uniqueY,
    maxCount,
    maxAverage
  };
};
TableComponent.correctSort = field => {
  switch (field) {
    case "numeric":
    case "exif.focalLength":
    case "exif.isoSpeedRating":
    case "exif.aperture":
    case "images.rating":
    default:
      return (a, b) => a - b;
  }
};
TableComponent.findByXY = (props, xVal, yVal, maxCount, maxAverage) => {
  const row = _.find(props.data, r => r[0] === xVal && r[1] === yVal);

  const count = row && row[2] ? row[2] : 0;
  const avergeRating = row && row[3] ? row[3] : 0;

  return {
    count,
    rating: avergeRating,
    relCount: count / maxCount,
    relRating: avergeRating / maxAverage
  };
};
