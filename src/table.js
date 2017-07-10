import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import squel from "squel";
import q from "q";
import _ from "lodash";
import { LoadingWrapper, BootstrapRow, Checkbox } from "./shared";
import * as Utilities from "./utilities";
import WorkerWrapper from "./worker-wrapper";

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
  const otherFields = _.reject(Utilities.aggregateFields, {
    field: props.otherField
  });
  return (
    <BootstrapRow>
      <div>
        <h3>
          Select {props.name}
        </h3>
        {otherFields.map(f =>
          <Checkbox
            key={f.field}
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

class Table extends PureComponent {
  static propTypes = {
    xField: PropTypes.string,
    yField: PropTypes.string
  };

  state = {
    loading: false
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
    this.getData(nextProps)
      .then(this.transformData.bind(this, nextProps))
      .then(data => {
        this.setState({
          data,
          loading: false
        });
      })
      .done();
  }

  getData(properties) {
    this.setState({ loading: true });

    let s = squel
      .select()
      .field(properties.xField)
      .field(properties.yField)
      .field("COUNT(images.id_local)")
      .field("AVG(IFNULL(images.rating, 0))")
      .from("Adobe_images", "images")
      .left_join(
        "AgHarvestedExifMetadata",
        "exif",
        "images.id_local = exif.image"
      )
      .left_join(
        "AgLibraryKeywordImage",
        "keywordImage",
        "images.id_local = keywordImage.image"
      )
      .left_join("AgLibraryKeyword", "face", "keywordImage.tag = face.id_local")
      .left_join(
        "AgInternedExifCameraModel",
        "camera",
        "exif.cameraModelRef = camera.id_local"
      )
      .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local")
      .where(`${properties.xField} IS NOT NULL`)
      .where(`${properties.yField} IS NOT NULL`)
      .where("face.keywordType = 'person' OR face.id_local IS NULL");

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      s = s.where(Utilities.getFilterExpression(key, value));
    });

    s = s
      .order(properties.xField)
      .order(properties.yField)
      .group(properties.xField)
      .group(properties.yField);

    const query = s.toString();

    return properties.worker.exec(query);
  }

  transformData(properties, rawData) {
    const dataset = (rawData && rawData[0] && rawData[0].values) || [];
    return q(dataset);
  }

  render() {
    return (
      <LoadingWrapper
        loading={this.state.loading}
        noData={!this.state.data || !this.state.data.length}
      >
        <TableComponent
          data={this.state.data}
          xField={this.props.xField}
          yField={this.props.yField}
        />
      </LoadingWrapper>
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
      <table className="table table-condensed table-col-hover table-bordered">
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
