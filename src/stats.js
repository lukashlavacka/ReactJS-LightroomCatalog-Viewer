import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import squel from "squel";
import q from "q";
import _ from "lodash";
import { LoadingWrapper } from "./shared";
import * as Utilities from "./utilities";

export default class PhotoStats extends PureComponent {
  static propTypes = {
    popularStats: PropTypes.array.isRequired,
    filter: PropTypes.object
  };

  static defaultProps = {
    popularStats: [
      { key: "camera", field: "camera.value", name: "Camera Model" },
      { key: "lens", field: "lens.value", name: "Lens" },
      {
        key: "focalLength",
        field: "exif.focalLength",
        name: "Focal Length",
        transform: val => `${val}mm`
      },
      { key: "aperture", field: "ROUND(exif.aperture, 2)", name: "Aperture" },
      { key: "iso", field: "exif.isoSpeedRating", name: "ISO" },
      {
        key: "shutter",
        field: "exif.shutterSpeed",
        name: "Shutter Speed",
        transform: val =>
          val > 0
            ? `1/${Math.round(100 / val)}s`
            : `${1 / Math.round(100 / val)}s`
      }
    ]
  };

  state = {
    loading: false,
    data: []
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
    const queries = this.props.popularStats.map(s => {
      let statQuery = squel
        .select()
        .field(s.field)
        .field("COUNT(images.id_local)")
        .from("Adobe_images", "images")
        .where(`${s.field} IS NOT NULL`)
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
        .left_join(
          "AgInternedExifCameraModel",
          "camera",
          "exif.cameraModelRef = camera.id_local"
        )
        .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local")
        .group(s.field)
        .order("COUNT(images.id_local)", false)
        .limit(1);

      _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
        statQuery = statQuery.where(Utilities.getFilterExpression(key, value));
      });
      return statQuery;
    });

    let sumQuery = squel
      .select()
      .field("COUNT(images.id_local)")
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
      .left_join(
        "AgInternedExifCameraModel",
        "camera",
        "exif.cameraModelRef = camera.id_local"
      )
      .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local");

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      sumQuery = sumQuery.where(Utilities.getFilterExpression(key, value));
    });

    queries.unshift(sumQuery);

    const query = queries.join(";");

    return properties.worker.exec(query);
  }

  transformData(properties, rawData) {
    const dataset = rawData || [];

    const totalCountDataset = dataset.splice(0, 1);
    const totalCount =
      (totalCountDataset[0] && totalCountDataset[0].values[0][0]) || 1;

    return q(
      dataset.map((d, i) => {
        const stat = this.props.popularStats[i];
        return {
          key: stat.key,
          name: stat.name,
          value: _.isFunction(stat.transform)
            ? stat.transform(d.values[0][0])
            : d.values[0][0],
          count: d.values[0][1],
          percentage: d.values[0][1] / totalCount
        };
      })
    );
  }

  render() {
    if (this.state.data.map)
      return (
        <LoadingWrapper
          loading={this.state.loading}
          noData={!this.state.data.length}
        >
          <table className="table">
            <thead>
              <tr>
                {this.state.data.map(s =>
                  <th key={s.key}>
                    {s.name}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {this.state.data.map(s =>
                  <td key={s.key}>
                    {s.value}
                  </td>
                )}
              </tr>
              <tr>
                {this.state.data.map(s =>
                  <td key={s.key}>
                    {s.count} photo(s) / {Math.round(s.percentage * 100)}%
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </LoadingWrapper>
      );
  }
}
